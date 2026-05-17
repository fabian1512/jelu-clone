package io.github.bayang.jelu.service

import io.github.bayang.jelu.errors.JeluException
import io.github.bayang.jelu.utils.imageName
import io.github.bayang.jelu.utils.validateDownloadUrl
import io.github.oshai.kotlinlogging.KotlinLogging
import org.apache.commons.io.FilenameUtils
import org.springframework.stereotype.Service
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection

private val logger = KotlinLogging.logger {}

private const val CONNECT_TIMEOUT_MS = 10_000
private const val READ_TIMEOUT_MS = 30_000
private const val MAX_DOWNLOAD_BYTES = 50L * 1024 * 1024
private const val BUFFER_SIZE = 8 * 1024

@Service
class DownloadService {
    fun download(
        sourceUrl: String,
        title: String,
        bookId: String,
        targetFolder: String,
    ): String {
        try {
            val uri = validateDownloadUrl(sourceUrl)
            logger.debug { "downloading ${uri.path} file ${uri.host}" }
            val url = uri.toURL()
            val conn = url.openConnection() as HttpURLConnection
            conn.connectTimeout = CONNECT_TIMEOUT_MS
            conn.readTimeout = READ_TIMEOUT_MS
            conn.instanceFollowRedirects = true
            conn.setRequestProperty("User-Agent", "jelu-app")
            conn.connect()
            val responseCode = conn.responseCode
            if (responseCode !in 200..299) {
                throw JeluException("Download failed with HTTP $responseCode for $sourceUrl")
            }
            val contentLength = conn.contentLengthLong
            if (contentLength > MAX_DOWNLOAD_BYTES) {
                conn.disconnect()
                throw JeluException("Download rejected: content length $contentLength exceeds maximum ${MAX_DOWNLOAD_BYTES}b")
            }
            val filename: String = imageName(title, bookId, FilenameUtils.getExtension(uri.path))
            val targetFile = File(targetFolder, filename)
            conn.inputStream.use { input ->
                FileOutputStream(targetFile).use { output ->
                    val buffer = ByteArray(BUFFER_SIZE)
                    var totalBytes = 0L
                    var bytesRead: Int
                    while (input.read(buffer).also { bytesRead = it } != -1) {
                        totalBytes += bytesRead
                        if (totalBytes > MAX_DOWNLOAD_BYTES) {
                            throw JeluException("Download exceeded maximum size of ${MAX_DOWNLOAD_BYTES}b")
                        }
                        output.write(buffer, 0, bytesRead)
                    }
                }
            }
            conn.disconnect()
            return filename
        } catch (e: Exception) {
            logger.error { "failed to download file from $sourceUrl: ${e.message}" }
            throw e
        }
    }
}
