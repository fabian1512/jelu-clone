package io.github.bayang.jelu.service.metadata.providers

import io.github.bayang.jelu.dto.MetadataDto
import io.github.bayang.jelu.dto.MetadataRequestDto
import io.github.oshai.kotlinlogging.KotlinLogging
import jakarta.annotation.Resource
import org.jsoup.Jsoup
import org.springframework.stereotype.Service
import org.springframework.web.client.RestClient
import org.w3c.dom.Element
import java.util.Optional
import javax.xml.parsers.DocumentBuilderFactory

private val logger = KotlinLogging.logger {}

@Service
class DnbMetadataProvider(
    @Resource(name = "springRestClient") private val restClient: RestClient,
) : IMetaDataProvider {
    private val name = "dnb"
    private val baseUrl = "https://services.dnb.de/sru/dnb"
    private val coverBaseUrl = "https://portal.dnb.de/opac/mvb/cover"

    override fun name(): String = name

    override fun fetchMetadata(
        metadataRequestDto: MetadataRequestDto,
        config: Map<String, String>,
    ): Optional<MetadataDto> {
        if (!metadataRequestDto.isbn.isNullOrBlank()) {
            val result = searchByIsbn(metadataRequestDto.isbn)
            if (result.isPresent) return result
        }
        return searchByTitleAndAuthor(metadataRequestDto.title, metadataRequestDto.authors)
    }

    override fun searchMetadata(
        metadataRequestDto: MetadataRequestDto,
        config: Map<String, String>,
    ): List<MetadataDto> {
        if (!metadataRequestDto.isbn.isNullOrBlank()) {
            val result = searchByIsbn(metadataRequestDto.isbn)
            if (result.isPresent) return listOf(result.get())
        }
        return searchByTitleAndAuthorList(metadataRequestDto.title, metadataRequestDto.authors)
    }

    private fun searchByIsbn(isbn: String): Optional<MetadataDto> {
        val cleanIsbn = isbn.replace("-", "").replace(" ", "")
        val query = "isbn=$cleanIsbn"
        val records = fetchSruRecords(query, 1)
        if (records.isEmpty()) {
            logger.debug { "DNB ISBN search for '$cleanIsbn': no results" }
            return Optional.empty()
        }
        val dto = parseRecord(records[0])
        return if (dto != null && !dto.title.isNullOrBlank()) {
            logger.debug { "DNB ISBN search for '$cleanIsbn': found '${dto.title}'" }
            Optional.of(dto)
        } else {
            Optional.empty()
        }
    }

    private fun searchByTitleAndAuthor(
        title: String?,
        authors: String?,
    ): Optional<MetadataDto> {
        val results = searchByTitleAndAuthorList(title, authors)
        return if (results.isNotEmpty()) Optional.of(results[0]) else Optional.empty()
    }

    private fun searchByTitleAndAuthorList(
        title: String?,
        authors: String?,
    ): List<MetadataDto> {
        val queryParts = mutableListOf<String>()
        if (!title.isNullOrBlank()) {
            queryParts.add("tit=$title")
        }
        if (!authors.isNullOrBlank()) {
            queryParts.add("per=$authors")
        }
        if (queryParts.isEmpty()) return emptyList()
        val query = queryParts.joinToString(" AND ")

        val records = fetchSruRecords(query, 20)
        val results = mutableListOf<MetadataDto>()
        for (record in records) {
            val dto = parseRecord(record)
            if (dto != null && !dto.title.isNullOrBlank()) {
                results.add(dto)
            }
        }
        logger.debug { "DNB search for '$query': ${results.size} results" }
        return results
    }

    private fun fetchSruRecords(
        query: String,
        maxRecords: Int,
    ): List<Element> {
        return try {
            val response =
                restClient
                    .get()
                    .uri { uriBuilder ->
                        uriBuilder
                            .scheme("https")
                            .host("services.dnb.de")
                            .path("/sru/dnb")
                            .queryParam("operation", "searchRetrieve")
                            .queryParam("version", "1.1")
                            .queryParam("query", query)
                            .queryParam("maximumRecords", maxRecords)
                            .queryParam("recordSchema", "MARC21-xml")
                            .build()
                    }.retrieve()
                    .body(String::class.java)

            if (response.isNullOrBlank()) return emptyList()

            val factory = DocumentBuilderFactory.newInstance()
            factory.isNamespaceAware = false
            val builder = factory.newDocumentBuilder()
            val doc = builder.parse(response.byteInputStream())
            val recordNodes = doc.getElementsByTagName("record")
            val records = mutableListOf<Element>()
            for (i in 0 until recordNodes.length) {
                val node = recordNodes.item(i)
                if (node is Element && node.getAttribute("type") == "Bibliographic") {
                    records.add(node)
                }
            }
            records
        } catch (e: Exception) {
            logger.warn { "DNB SRU request failed for query '$query': ${e.message}" }
            emptyList()
        }
    }

    private fun parseRecord(record: Element): MetadataDto? =
        try {
            val dto = MetadataDto()

            // ISBN
            val isbn = getDatafieldSubfield(record, "020", "a")
            if (!isbn.isNullOrBlank()) {
                val cleanIsbn = isbn.replace("-", "").replace(" ", "")
                when {
                    cleanIsbn.length == 13 -> dto.isbn13 = cleanIsbn
                    cleanIsbn.length == 10 -> dto.isbn10 = cleanIsbn
                }
            }

            // Author — prefer pen name from 245$c over real name from 100$a
            val titleStatement = cleanMarc21Text(getDatafieldSubfield(record, "245", "c"))
            val authorFromTitle = extractAuthorFromTitleStatement(titleStatement)
            if (!authorFromTitle.isNullOrBlank()) {
                dto.authors.add(authorFromTitle)
            } else {
                val authorRaw = getDatafieldSubfield(record, "100", "a")
                if (!authorRaw.isNullOrBlank()) {
                    dto.authors.add(reorderName(authorRaw))
                }
            }

            // Title
            val title = cleanMarc21Text(getDatafieldSubfield(record, "245", "a"))
            val subtitle = cleanMarc21Text(getDatafieldSubfield(record, "245", "b"))
            dto.title = title

            // Publisher
            dto.publisher = cleanMarc21Text(getDatafieldSubfield(record, "264", "b"))

            // Publication date
            val dateStr = getDatafieldSubfield(record, "264", "c")
            if (!dateStr.isNullOrBlank()) {
                dto.publishedDate = extractYear(dateStr)
            }

            // Page count
            val pagesStr = getDatafieldSubfield(record, "300", "a")
            if (!pagesStr.isNullOrBlank()) {
                dto.pageCount = extractPageCount(pagesStr)
            }

            // Series
            val seriesName =
                cleanMarc21Text(getDatafieldSubfield(record, "490", "a"))
                    ?: cleanMarc21Text(getDatafieldSubfield(record, "830", "a"))
            if (!seriesName.isNullOrBlank()) {
                dto.series = seriesName
            }
            val seriesNumber =
                getDatafieldSubfield(record, "490", "v")
                    ?: getDatafieldSubfield(record, "830", "v")
            if (!seriesNumber.isNullOrBlank()) {
                dto.numberInSeries = seriesNumber.toDoubleOrNull()
            }

            // Language
            val lang = getDatafieldSubfield(record, "041", "a")
            if (!lang.isNullOrBlank()) {
                dto.language = mapLanguage(lang)
            }

            // Keywords/tags (max 5, filter internal codes)
            val keywords = getDatafieldSubfields(record, "653", "a")
            var tagCount = 0
            for (keyword in keywords) {
                val cleaned = cleanMarc21Text(keyword)
                if (!cleaned.isNullOrBlank() && !cleaned.startsWith("(") && tagCount < 5) {
                    dto.tags.add(cleaned)
                    tagCount++
                }
            }

            // Translators (role code "trl")
            val contributors = getDatafieldsByTag(record, "700")
            for (contributor in contributors) {
                val roleCode = getSubfield(contributor, "4")
                val contributorName = cleanMarc21Text(getSubfield(contributor, "a"))
                if (!contributorName.isNullOrBlank() && roleCode == "trl") {
                    dto.translators.add(reorderName(contributorName))
                }
            }

            // Description from 856 links (Inhaltstext), fallback to subtitle
            dto.summary = fetchDescription(record)
            if (dto.summary.isNullOrBlank() && !subtitle.isNullOrBlank()) {
                dto.summary = subtitle
            }

            // Cover image from DNB
            val coverIsbn = dto.isbn13 ?: dto.isbn10
            if (!coverIsbn.isNullOrBlank()) {
                dto.image = "$coverBaseUrl?isbn=$coverIsbn"
            }

            dto
        } catch (e: Exception) {
            logger.warn { "DNB MARC21 parse error: ${e.message}" }
            null
        }

    private fun getDatafieldSubfield(
        record: Element,
        tag: String,
        code: String,
    ): String? {
        val datafields = record.getElementsByTagName("datafield")
        for (i in 0 until datafields.length) {
            val df = datafields.item(i) as? Element ?: continue
            if (df.getAttribute("tag") == tag) {
                val subfields = df.getElementsByTagName("subfield")
                for (j in 0 until subfields.length) {
                    val sf = subfields.item(j) as? Element ?: continue
                    if (sf.getAttribute("code") == code) {
                        return sf.textContent?.trim()
                    }
                }
            }
        }
        return null
    }

    private fun getDatafieldSubfields(
        record: Element,
        tag: String,
        code: String,
    ): List<String> {
        val results = mutableListOf<String>()
        val datafields = record.getElementsByTagName("datafield")
        for (i in 0 until datafields.length) {
            val df = datafields.item(i) as? Element ?: continue
            if (df.getAttribute("tag") == tag) {
                val subfields = df.getElementsByTagName("subfield")
                for (j in 0 until subfields.length) {
                    val sf = subfields.item(j) as? Element ?: continue
                    if (sf.getAttribute("code") == code) {
                        sf.textContent?.trim()?.let { results.add(it) }
                    }
                }
            }
        }
        return results
    }

    private fun getDatafieldsByTag(
        record: Element,
        tag: String,
    ): List<Element> {
        val results = mutableListOf<Element>()
        val datafields = record.getElementsByTagName("datafield")
        for (i in 0 until datafields.length) {
            val df = datafields.item(i) as? Element ?: continue
            if (df.getAttribute("tag") == tag) {
                results.add(df)
            }
        }
        return results
    }

    private fun getSubfield(
        datafield: Element,
        code: String,
    ): String? {
        val subfields = datafield.getElementsByTagName("subfield")
        for (i in 0 until subfields.length) {
            val sf = subfields.item(i) as? Element ?: continue
            if (sf.getAttribute("code") == code) {
                return sf.textContent?.trim()
            }
        }
        return null
    }

    private fun reorderName(name: String): String {
        // "Lamballe, Marie" → "Marie Lamballe"
        val cleaned = cleanMarc21Text(name) ?: name
        val parts = cleaned.split(",", limit = 2)
        return if (parts.size == 2) {
            "${parts[1].trim()} ${parts[0].trim()}"
        } else {
            cleaned.trim()
        }
    }

    private fun cleanMarc21Text(text: String?): String? {
        if (text.isNullOrBlank()) return text
        // Strip C1 control characters (U+0080–U+009F) used as MARC21 field terminators
        val sb = StringBuilder(text.length)
        for (c in text) {
            val code = c.code
            if (code in 0x80..0x9F) {
                continue
            }
            sb.append(c)
        }
        return sb.toString().trim()
    }

    private fun extractYear(dateStr: String): String {
        // "2019" or "februar de 2025" or "[2024]"
        val match = Regex("\\d{4}").find(dateStr)
        return match?.value ?: dateStr.trim()
    }

    private fun extractPageCount(pagesStr: String): Int? {
        // "559 Seiten" or "Online-Ressource, 559 Seiten" or "496 Seiten"
        val match = Regex("(\\d+)\\s*[Ss]eiten").find(pagesStr)
        return match?.groupValues?.get(1)?.toIntOrNull()
    }

    private fun mapLanguage(lang: String): String =
        when (lang.lowercase()) {
            "ger" -> "de"
            "eng" -> "en"
            "fra", "fre" -> "fr"
            "spa" -> "es"
            "ita" -> "it"
            "dut" -> "nl"
            "por" -> "pt"
            "rus" -> "ru"
            "jpn" -> "ja"
            "chi" -> "zh"
            "kor" -> "ko"
            "ara" -> "ar"
            else -> lang.take(2).lowercase()
        }

    private fun extractAuthorFromTitleStatement(titleStatement: String?): String? {
        if (titleStatement.isNullOrBlank()) return null
        // "Lucinda Riley als Lucinda Edmonds ; aus dem Englischen von ..."
        // → extract "Lucinda Riley" (before " als " or " ; ")
        val beforeSemicolon = titleStatement.split(" ; ").first().trim()
        val parts = beforeSemicolon.split(" als ", ignoreCase = true)
        return if (parts.size >= 2) {
            parts[0].trim()
        } else {
            null
        }
    }

    private fun findDescriptionUrls(record: Element): List<String> {
        val urls = mutableListOf<String>()
        val datafields = record.getElementsByTagName("datafield")
        for (i in 0 until datafields.length) {
            val df = datafields.item(i) as? Element ?: continue
            if (df.getAttribute("tag") == "856") {
                val label = getSubfield(df, "3")
                if (label == "Inhaltstext") {
                    getSubfield(df, "u")?.let { urls.add(it) }
                }
            }
        }
        return urls
    }

    private fun fetchDescription(record: Element): String? {
        val urls = findDescriptionUrls(record)
        for (url in urls) {
            val text = fetchDescriptionFromUrl(url)
            if (!text.isNullOrBlank()) return text
        }
        return null
    }

    private fun fetchDescriptionFromUrl(url: String): String? {
        return try {
            val response =
                restClient
                    .get()
                    .uri(url)
                    .header("User-Agent", "Mozilla/5.0 (compatible; JeluBot/1.0)")
                    .retrieve()
                    .body(String::class.java)
            if (response.isNullOrBlank()) return null
            // Extract text from HTML — look for common description patterns
            val doc = Jsoup.parse(response)
            // Try meta description first
            val metaDesc = doc.selectFirst("meta[name=description]")?.attr("content")
            if (!metaDesc.isNullOrBlank()) return metaDesc.trim()
            // Try og:description
            val ogDesc = doc.selectFirst("meta[property=og:description]")?.attr("content")
            if (!ogDesc.isNullOrBlank()) return ogDesc.trim()
            // Try paragraph text in main content areas
            val paragraphs = doc.select("p, .description, .klappentext, .inhalt")
            for (p in paragraphs) {
                val text = p.text().trim()
                if (text.length > 50) return text
            }
            // Try div with substantial text (DNB deposit pages use inline-styled divs)
            val divs = doc.select("div, body")
            for (div in divs) {
                val text = div.text().trim()
                if (text.length > 100 && text.length < 5000) return text
            }
            null
        } catch (e: Exception) {
            logger.debug { "DNB description fetch failed for $url: ${e.message}" }
            null
        }
    }
}
