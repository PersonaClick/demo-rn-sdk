import UserNotifications

/// Attaches the picture that comes with a push so iOS can render it.
///
/// iOS never downloads media on its own. A payload marked `mutable-content: 1` is handed to this
/// extension first, and whatever it attaches before calling the content handler is what the user
/// sees. Without this target an image push arrives as plain text, no matter how the payload looks.
final class NotificationService: UNNotificationServiceExtension {
  private var contentHandler: ((UNNotificationContent) -> Void)?
  private var bestAttempt: UNMutableNotificationContent?

  /// Keys the picture may arrive under. PersonaClick sends `image`; `image_url` is the older name,
  /// and `fcm_options.image` is what Firebase adds when the push travels through FCM.
  private static let imageKeys = ["image", "image_url", "attachment-url", "attachment_url"]

  override func didReceive(
    _ request: UNNotificationRequest,
    withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
  ) {
    self.contentHandler = contentHandler

    guard let content = request.content.mutableCopy() as? UNMutableNotificationContent else {
      contentHandler(request.content)
      return
    }
    bestAttempt = content

    guard let url = Self.imageURL(in: content.userInfo) else {
      contentHandler(content)
      return
    }

    Self.download(url) { attachment in
      if let attachment {
        content.attachments = [attachment]
      }
      contentHandler(content)
    }
  }

  /// iOS gives the extension about 30 seconds. Deliver whatever is ready when the time runs out —
  /// a notification without the picture still beats no notification at all.
  override func serviceExtensionTimeWillExpire() {
    if let contentHandler, let bestAttempt {
      contentHandler(bestAttempt)
    }
  }

  private static func imageURL(in userInfo: [AnyHashable: Any]) -> URL? {
    for key in imageKeys {
      if let value = userInfo[key] as? String, let url = URL(string: value) {
        return url
      }
    }

    if let options = userInfo["fcm_options"] as? [String: Any],
       let value = options["image"] as? String,
       let url = URL(string: value) {
      return url
    }

    return nil
  }

  private static func download(
    _ url: URL,
    completion: @escaping (UNNotificationAttachment?) -> Void
  ) {
    URLSession.shared.downloadTask(with: url) { location, response, _ in
      guard let location else {
        completion(nil)
        return
      }

      // The attachment file needs an extension iOS recognises, and image URLs often have none —
      // so fall back to the response's MIME type before guessing.
      let suffix = fileExtension(for: response, url: url)
      let target = URL(fileURLWithPath: NSTemporaryDirectory())
        .appendingPathComponent(UUID().uuidString + suffix)

      do {
        try FileManager.default.moveItem(at: location, to: target)
        completion(try UNNotificationAttachment(identifier: "image", url: target))
      } catch {
        completion(nil)
      }
    }.resume()
  }

  private static func fileExtension(for response: URLResponse?, url: URL) -> String {
    switch response?.mimeType {
    case "image/jpeg": return ".jpg"
    case "image/png": return ".png"
    case "image/gif": return ".gif"
    case "image/webp": return ".webp"
    default:
      let pathExtension = url.pathExtension
      return pathExtension.isEmpty ? ".jpg" : ".\(pathExtension)"
    }
  }
}
