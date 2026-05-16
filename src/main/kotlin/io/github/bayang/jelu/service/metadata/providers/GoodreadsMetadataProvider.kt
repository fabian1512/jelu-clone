package io.github.bayang.jelu.service.metadata.providers

import com.fasterxml.jackson.databind.ObjectMapper
import io.github.bayang.jelu.config.JeluProperties
import io.github.bayang.jelu.dao.MetadataProviderSettingRepository
import io.github.bayang.jelu.dto.MetadataDto
import io.github.bayang.jelu.dto.MetadataRequestDto
import io.github.oshai.kotlinlogging.KotlinLogging
import jakarta.annotation.Resource
import org.jsoup.Jsoup
import org.jsoup.nodes.Document
import org.springframework.stereotype.Service
import org.springframework.web.client.RestClient
import java.net.URLEncoder
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Optional

private val logger = KotlinLogging.logger {}

@Service
class GoodreadsMetadataProvider(
    @Resource(name = "springRestClient") private val restClient: RestClient,
    private val objectMapper: ObjectMapper,
    private val properties: JeluProperties,
    private val settingsRepository: MetadataProviderSettingRepository,
) : IMetaDataProvider {
    private val name = "goodreads"
    private val baseUrl = "https://www.goodreads.com"

    override fun name(): String = name

    private fun getGoodreadsCookie(): String? {
        val dbSetting = settingsRepository.findAll().find { it.name.equals(name, true) }
        if (dbSetting != null && !dbSetting.config.isNullOrBlank()) {
            return dbSetting.config
        }
        return properties.metadataProviders?.find { it.isEnabled && it.name == name }?.config
    }

    private fun hasValidCookie(): Boolean {
        val cookie = getGoodreadsCookie()
        if (cookie.isNullOrBlank()) {
            logger.debug("No Goodreads cookie configured")
            return false
        }
        return true
    }

    private fun verifySession(): Boolean {
        val cookie = getGoodreadsCookie() ?: return false
        return try {
            val response =
                restClient
                    .get()
                    .uri("$baseUrl/user/show/1")
                    .header("Cookie", cookie)
                    .header("User-Agent", userAgent)
                    .retrieve()
                    .body(String::class.java)
            response?.contains("Edit profile") == true || response?.contains("Edit my profile") == true
        } catch (e: Exception) {
            logger.warn("Goodreads session verification failed: ${e.message}")
            false
        }
    }

    private fun fetchHtml(
        url: String,
        cookie: String?,
    ): String? =
        try {
            val request =
                restClient
                    .get()
                    .uri(url)
                    .header("User-Agent", userAgent)
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .header("Accept-Language", "en-US,en;q=0.9")
            if (!cookie.isNullOrBlank()) {
                request.header("Cookie", cookie)
            }
            request.retrieve().body(String::class.java)
        } catch (e: Exception) {
            logger.warn { "Failed to fetch $url: ${e.message}" }
            null
        }

    override fun searchMetadata(
        metadataRequestDto: MetadataRequestDto,
        config: Map<String, String>,
    ): List<MetadataDto> {
        val cookie = getGoodreadsCookie()

        val query =
            if (!metadataRequestDto.isbn.isNullOrBlank()) {
                metadataRequestDto.isbn
            } else {
                val title = metadataRequestDto.title ?: ""
                val authors = metadataRequestDto.authors ?: ""
                "$title $authors"
            }.trim()

        if (query.isBlank()) {
            return emptyList()
        }

        return try {
            val searchUrl = "$baseUrl/search/index.html?q=${URLEncoder.encode(query, "UTF-8")}"
            val html = fetchHtml(searchUrl, cookie) ?: return emptyList()
            val searchDoc = Jsoup.parse(html)

            val results = mutableListOf<MetadataDto>()

            // Check if we were redirected to a book detail page directly (e.g. ISBN search)
            if (searchDoc.selectFirst("h1[data-testid=bookTitle], h1#bookTitle") != null) {
                val dto = MetadataDto()
                parseJsonLd(searchDoc, dto)
                parseHtmlInto(searchDoc, dto)
                parseNextData(html, dto)
                if (!dto.title.isNullOrBlank()) {
                    results.add(dto)
                }
            } else {
                // Regular search results list
                val bookRows = searchDoc.select("a.bookTitle[href*=/book/show/]")

                for (row in bookRows.take(20)) {
                    val dto = MetadataDto()
                    dto.title = row.text().trim()

                    val href = row.attr("href")
                    dto.goodreadsId = extractBookId(href)

                    val parentTableRow = row.closest("tr")
                    if (parentTableRow != null) {
                        val authorEl = parentTableRow.selectFirst("a.authorName span[itemprop=name]")
                        if (authorEl != null) {
                            dto.authors.add(authorEl.text().trim())
                        }

                        val coverEl = parentTableRow.selectFirst("img.bookCover")
                        if (coverEl != null) {
                            val src = coverEl.attr("src")
                            dto.image =
                                src
                                    .replace("._SY75_.jpg", "._SY300_.jpg")
                                    .replace("._SY75_", "._SY300_")
                        }
                    }

                    if (!dto.title.isNullOrBlank()) {
                        results.add(dto)
                    }
                }
            }

            if (results.isEmpty()) {
                logger.warn { "Goodreads search for '$query': No book links found. HTML sample: ${html.take(500)}" }
            } else {
                logger.info { "Goodreads search for '$query': ${results.size} results" }
            }

            results
        } catch (e: Exception) {
            logger.warn { "Goodreads search failed for query '$query': ${e.message}" }
            emptyList()
        }
    }

    override fun fetchMetadata(
        metadataRequestDto: MetadataRequestDto,
        config: Map<String, String>,
    ): Optional<MetadataDto> {
        val cookie = getGoodreadsCookie()

        // If we have a goodreadsId, load detail page directly
        if (!metadataRequestDto.goodreadsId.isNullOrBlank()) {
            val bookUrl = "$baseUrl/book/show/${metadataRequestDto.goodreadsId}"
            val dto = parseBookPage(bookUrl, cookie)
            if (dto.isPresent) {
                return dto
            }
        }

        // Fallback to ISBN search
        val isbn =
            metadataRequestDto.isbn
                ?.replace("-", "", true)
                ?.replace(" ", "", true)
        if (isbn.isNullOrBlank()) {
            return Optional.empty()
        }
        val bookUrl = searchByIsbn(isbn, cookie)
        if (bookUrl == null) {
            logger.debug("No Goodreads page found for isbn $isbn")
            return Optional.empty()
        }
        return parseBookPage(bookUrl, cookie)
    }

    private fun extractBookId(href: String): String? {
        val match = Regex("/book/show/(\\d+)").find(href)
        return match?.groupValues?.getOrNull(1)
    }

    private fun searchByIsbn(
        isbn: String,
        cookie: String?,
    ): String? {
        // try original ISBN first
        val result = trySearchIsbn(isbn, cookie)
        if (result != null) return result

        // if that fails, try converting between ISBN-10 and ISBN-13
        val converted =
            when (isbn.length) {
                10 -> isbn10to13(isbn)
                13 -> isbn13to10(isbn)
                else -> null
            }
        if (converted != null && converted != isbn) {
            logger.debug("ISBN $isbn not found, trying converted $converted")
            return trySearchIsbn(converted, cookie)
        }
        return null
    }

    private fun trySearchIsbn(
        isbn: String,
        cookie: String?,
    ): String? {
        // 1: search URL
        try {
            val searchUrl = "$baseUrl/search/index.html?q=$isbn"
            val html = fetchHtml(searchUrl, cookie)
            if (html != null) {
                val doc = Jsoup.parse(html)
                val link = doc.selectFirst("td.field.title a.bookTitle")?.attr("href")
                if (link != null) return "$baseUrl$link"
                val altLink = doc.selectFirst("a.bookTitle")?.attr("href")
                if (altLink != null) return "$baseUrl$altLink"
                if (doc.selectFirst("h1[data-testid=bookTitle]") != null) {
                    return searchUrl
                }
            }
        } catch (_: Exception) {
        }

        // 2: fallback to direct URL
        try {
            val directUrl = "$baseUrl/book/isbn/$isbn"
            val html = fetchHtml(directUrl, cookie)
            if (html != null) {
                val doc = Jsoup.parse(html)
                if (doc.selectFirst("h1[data-testid=bookTitle]") != null || doc.selectFirst("h1#bookTitle") != null) {
                    return directUrl
                }
            }
        } catch (_: Exception) {
        }
        return null
    }

    private fun isbn10to13(isbn10: String): String? {
        if (isbn10.length != 10) return null
        val prefix = "978" + isbn10.substring(0, 9)
        var sum = 0
        for (i in prefix.indices) {
            val digit = prefix[i].digitToIntOrNull() ?: return null
            sum += digit * if (i % 2 == 0) 1 else 3
        }
        val check = (10 - (sum % 10)) % 10
        return prefix + check
    }

    private fun isbn13to10(isbn13: String): String? {
        if (isbn13.length != 13 || !isbn13.startsWith("978")) {
            return null
        }
        val base = isbn13.substring(3, 12)
        var sum = 0
        for (i in base.indices) {
            val digit = base[i].digitToIntOrNull() ?: return null
            sum += digit * (10 - i)
        }
        val check = (11 - (sum % 11)) % 11
        return base + if (check == 10) "X" else check.toString()
    }

    private fun parseBookPage(
        url: String,
        cookie: String?,
    ): Optional<MetadataDto> {
        val html = fetchHtml(url, cookie) ?: return Optional.empty()
        val doc = Jsoup.parse(html)
        val dto = MetadataDto()
        parseJsonLd(doc, dto)
        parseHtmlInto(doc, dto)
        parseNextData(html, dto)

        logger.info(
            "goodreads parse: title={}, summary={}, authors={}, isbn13={}",
            dto.title != null,
            dto.summary != null,
            dto.authors.size,
            dto.isbn13 != null,
        )

        if (dto.title.isNullOrBlank()) {
            logger.debug("Failed to parse Goodreads page $url – no title found")
            return Optional.empty()
        }
        return Optional.of(dto)
    }

    private fun parseHtmlInto(
        doc: Document,
        dto: MetadataDto,
    ) {
        // title
        if (dto.title == null) {
            doc.selectFirst("h1[data-testid=bookTitle]")?.text()?.let { dto.title = it }
        }
        if (dto.title == null) {
            doc.selectFirst("h1#bookTitle")?.text()?.let { dto.title = it }
        }
        if (dto.title == null) {
            doc.select("meta[property=og:title]")?.attr("content")?.let { dto.title = it }
        }

        // authors + translators (ContributorLinks with role filtering, overrides JSON-LD)
        val contributorLinks = doc.select("a.ContributorLink")
        if (contributorLinks.isNotEmpty()) {
            val realAuthors = mutableSetOf<String>()
            val translators = mutableSetOf<String>()
            contributorLinks.forEach { link ->
                val roleSpan = link.selectFirst("[data-testid=role]")
                if (roleSpan != null) {
                    val nameSpan = link.selectFirst(".ContributorLink__name, span[data-testid=name]")
                    if (nameSpan != null) {
                        val roleText = roleSpan.text().trim()
                        if (roleText.contains("Translator")) {
                            translators.add(nameSpan.text().trim())
                        }
                    }
                    return@forEach
                }
                val nameSpan = link.selectFirst(".ContributorLink__name, span[data-testid=name]")
                if (nameSpan != null) {
                    realAuthors.add(nameSpan.text().trim())
                }
            }
            if (realAuthors.isNotEmpty()) {
                dto.authors = realAuthors
            }
            if (translators.isNotEmpty()) {
                dto.translators = translators
            }
        }

        // authors (HTML fallback if JSON-LD didn't have them)
        if (dto.authors.isEmpty()) {
            doc.select("span[data-testid=authorname] a").forEach { dto.authors.add(it.text().trim()) }
        }
        if (dto.authors.isEmpty()) {
            doc.select("a.authorName span").forEach { dto.authors.add(it.text().trim()) }
        }
        if (dto.authors.isEmpty()) {
            doc.select("div#bookAuthors a[href*=/author/show/] span").forEach { dto.authors.add(it.text().trim()) }
        }
        if (dto.authors.isEmpty()) {
            doc.select("a.ContributorLink")?.eachText()?.let { authors -> dto.authors.addAll(authors.map { it.trim() }) }
        }

        // summary
        doc.selectFirst("div[data-testid=description] span[role=none]")?.text()?.let {
            dto.summary = it.trim()
        }
        if (dto.summary == null) {
            doc.selectFirst("#description span[style*='none']")?.text()?.let {
                dto.summary = it.trim()
            }
        }
        if (dto.summary == null) {
            doc.selectFirst("div#description span")?.text()?.let {
                dto.summary = it.trim()
            }
        }
        if (dto.summary == null) {
            doc.selectFirst("span.Formatted")?.text()?.let {
                dto.summary = it.trim()
            }
        }
        if (dto.summary == null) {
            doc.select("meta[property='og:description']")?.attr("content")?.let {
                dto.summary = it.trim()
            }
        }

        // image (HTML fallback)
        if (dto.image == null) {
            doc.selectFirst("img.ResponsiveImage")?.attr("src")?.let { dto.image = it }
        }
        if (dto.image == null) {
            doc.selectFirst("div.BookCover img")?.attr("src")?.let { dto.image = it }
        }
        if (dto.image == null) {
            doc.selectFirst("img[src*='books/']")?.attr("src")?.let { dto.image = it }
        }
        if (dto.image == null) {
            doc.select("meta[property=og:image]")?.attr("content")?.let { dto.image = it }
        }

        // details section: publisher, publishedDate, isbn (HTML fallback)
        val detailElements = doc.select("div[data-testid=bookDetails] p")
        if (detailElements.isEmpty()) {
            doc.select("div#bookDetailsBox div.infoBoxRowItem").forEach { detailElements.add(it) }
        }
        for (div in detailElements) {
            val text = div.text()
            when {
                text.contains("Publisher", true) && dto.publisher == null -> {
                    dto.publisher =
                        text
                            .replace("Publisher", "", true)
                            .replace(":", "")
                            .trim()
                }
                text.contains("Page", true) && dto.pageCount == null -> {
                    dto.pageCount = text.replace("[^0-9]".toRegex(), "").toIntOrNull()
                }
                text.contains("Published", true) && dto.publishedDate == null -> {
                    dto.publishedDate = text.removePrefix("Published", true).trim()
                }
                text.contains("ISBN", true) && dto.isbn13 == null -> {
                    val raw =
                        text
                            .removePrefix("ISBN", true)
                            .replace("-", "")
                            .replace(" ", "")
                            .trim()
                    when {
                        raw.length == 13 -> dto.isbn13 = raw
                        raw.length == 10 -> dto.isbn10 = raw
                    }
                }
            }
        }

        // tags (genres)
        val tags = mutableSetOf<String>()
        doc.select("a[data-testid=bookGenre]").forEach { tags.add(it.text().trim()) }
        if (tags.isEmpty()) {
            doc.select("a.bookPageGenreLink[href*=/genres/]").forEach { tags.add(it.text().trim()) }
        }
        dto.tags = tags
    }

    private fun parseNextData(
        html: String,
        dto: MetadataDto,
    ) {
        try {
            val tag = "<script id=\"__NEXT_DATA__\" type=\"application/json\">"
            val tagIdx = html.indexOf(tag)
            if (tagIdx < 0) return
            val jsonStart = tagIdx + tag.length
            val jsonEnd = html.indexOf("</script>", jsonStart)
            if (jsonEnd < 0) return
            val root = objectMapper.readTree(html.substring(jsonStart, jsonEnd))

            val apolloState = root.at("/props/pageProps/apolloState")
            if (apolloState.isMissingNode || !apolloState.isObject) return

            val fields = apolloState.fieldNames()
            while (fields.hasNext()) {
                val value = apolloState.get(fields.next())
                if (value == null || !value.isObject) continue
                val details = value.get("details")
                if (details == null || !details.isObject) continue
                if (details.get("__typename")?.asText() != "BookDetails") continue

                if (dto.publishedDate == null) {
                    details.get("publicationTime")?.asLong()?.let { epochMs ->
                        dto.publishedDate = dateFromEpochMs(epochMs)
                    }
                }
                if (dto.publisher == null) {
                    details.get("publisher")?.asText()?.let { dto.publisher = it }
                }
                if (dto.isbn13 == null) {
                    details.get("isbn13")?.asText()?.let { dto.isbn13 = it }
                }
                if (dto.isbn10 == null) {
                    details.get("isbn")?.asText()?.let { dto.isbn10 = it }
                }
                if (dto.pageCount == null) {
                    details.get("numPages")?.asInt()?.let { dto.pageCount = it }
                }
            }
        } catch (e: Exception) {
            logger.debug { "Failed to parse __NEXT_DATA__: ${e.message}" }
        }
    }

    private fun dateFromEpochMs(epochMs: Long): String =
        Instant
            .ofEpochMilli(epochMs)
            .atZone(ZoneId.of("UTC"))
            .toLocalDate()
            .format(DateTimeFormatter.ISO_LOCAL_DATE)

    private fun parseJsonLd(
        doc: Document,
        dto: MetadataDto,
    ) {
        try {
            val scriptTag = doc.selectFirst("script[type=application/ld+json]") ?: return
            val json = scriptTag.data()
            val root = objectMapper.readTree(json)

            // Title
            root.get("name")?.asText()?.let { dto.title = it }

            // Authors
            val authorNode = root.get("author")
            if (authorNode != null) {
                val authorList =
                    if (authorNode.isArray) {
                        authorNode.mapNotNull { it.get("name")?.asText() }
                    } else {
                        listOfNotNull(authorNode.get("name")?.asText())
                    }
                dto.authors = authorList.toMutableSet()
            }

            // Image
            root.get("image")?.asText()?.let { dto.image = it }

            // ISBN
            val isbnText = root.get("isbn")?.asText()
            if (!isbnText.isNullOrBlank()) {
                val clean =
                    isbnText.replace("-", "").replace(" ", "")
                when {
                    clean.length == 13 -> dto.isbn13 = clean
                    clean.length == 10 -> dto.isbn10 = clean
                }
            }

            // Page count
            dto.pageCount = root.get("numberOfPages")?.asInt()

            // Language
            root.get("inLanguage")?.asText()?.let { dto.language = it }

            logger.debug("JSON-LD parsed: title={}, isbn={}, authors={}", dto.title, isbnText, dto.authors.size)
        } catch (e: Exception) {
            logger.debug("Failed to parse JSON-LD: ${e.message}")
        }
    }

    private val userAgent =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

    private fun fetchDocument(
        url: String,
        retries: Int = 3,
    ): Document? {
        repeat(retries - 1) {
            try {
                return Jsoup
                    .connect(url)
                    .userAgent(userAgent)
                    .timeout(10_000)
                    .followRedirects(true)
                    .get()
            } catch (e: Exception) {
                logger.warn("Attempt ${it + 1} failed for $url: ${e.message}")
                Thread.sleep(500)
            }
        }
        return try {
            Jsoup
                .connect(url)
                .userAgent(userAgent)
                .timeout(10_000)
                .followRedirects(true)
                .get()
        } catch (e: Exception) {
            logger.error("Final attempt failed for $url: ${e.message}", e)
            null
        }
    }

    private fun String.removePrefix(
        prefix: String,
        ignoreCase: Boolean = false,
    ): String {
        if (ignoreCase) {
            val idx = this.indexOf(prefix, 0, ignoreCase)
            return if (idx == 0) this.removePrefix(prefix) else this
        }
        return this.removePrefix(prefix)
    }
}
