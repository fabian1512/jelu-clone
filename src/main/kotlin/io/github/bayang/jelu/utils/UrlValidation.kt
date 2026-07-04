package io.github.bayang.jelu.utils

import io.github.bayang.jelu.errors.JeluException
import java.net.InetAddress
import java.net.URI
import java.net.UnknownHostException

private val BLOCKED_HOSTS =
    listOf(
        "localhost",
        "127.0.0.1",
        "[::1]",
        "[0:0:0:0:0:0:0:1]",
        "0.0.0.0",
        "metadata.google.internal",
        "169.254.169.254",
    )

fun validateDownloadUrl(urlString: String): URI {
    val uri =
        try {
            URI(urlString)
        } catch (e: Exception) {
            throw JeluException("Invalid download URL: ${e.message}")
        }
    val scheme = uri.scheme?.lowercase() ?: throw JeluException("Download URL must have a scheme")
    if (scheme != "http" && scheme != "https") {
        throw JeluException("Download URL must use http or https, got: $scheme")
    }
    val host = uri.host?.lowercase() ?: throw JeluException("Download URL must have a host")
    val path = uri.path ?: ""

    // Allow localhost for internal API endpoints (e.g., /api/v1/dnb-cover/)
    val isInternalApi = host in listOf("localhost", "127.0.0.1") && path.startsWith("/api/")

    if (!isInternalApi && host in BLOCKED_HOSTS) {
        throw JeluException("Download to local/private host is not allowed: $host")
    }
    if (host.endsWith(".local") || host.endsWith(".internal")) {
        throw JeluException("Download to local/internal host is not allowed: $host")
    }
    val addr =
        try {
            InetAddress.getByName(host)
        } catch (e: UnknownHostException) {
            throw JeluException("Download URL host cannot be resolved: $host")
        }
    if (!isInternalApi && (addr.isLoopbackAddress || addr.isLinkLocalAddress || addr.isSiteLocalAddress || addr.isMulticastAddress)) {
        throw JeluException("Download to private/reserved address is not allowed: ${addr.hostAddress}")
    }
    return uri
}
