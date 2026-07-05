/**
 * Utility to transform original Firebase Storage URLs to optimized thumbnails (.webp).
 * This significantly reduces egress costs and improves LCP metrics on Home/Feed lists.
 * It assumes a Firebase Image Resizing Extension is active and configured mapping sizing to WEBP.
 */
export class ImageTransformer {
  static getOptimizedUrl(
    originalUrl?: string,
    size: string = "400x400",
  ): string | undefined {
    if (!originalUrl || typeof originalUrl !== "string") return originalUrl;

    // Only intercept Firebase Storage URLs
    if (!originalUrl.includes("firebasestorage.googleapis.com")) {
      return originalUrl;
    }

    try {
      const urlObj = new URL(originalUrl);
      const pathSegments = urlObj.pathname.split("/");
      const lastSegment = pathSegments[pathSegments.length - 1];

      // Decode the segment
      const decodedSegment = decodeURIComponent(lastSegment);

      // Check if it already has a size suffix to avoid double transformation
      if (/_(\d+x\d+)\.(webp|jpeg|jpg|png|gif)$/i.test(decodedSegment)) {
        return originalUrl;
      }

      // Find extension (if any)
      const lastDotIndex = decodedSegment.lastIndexOf(".");
      if (lastDotIndex === -1) return originalUrl; // No extension found, don't touch

      const name = decodedSegment.substring(0, lastDotIndex);

      // Generate forced webp Web Extension path
      const transformedName = `${name}_${size}.webp`;

      pathSegments[pathSegments.length - 1] =
        encodeURIComponent(transformedName);
      urlObj.pathname = pathSegments.join("/");

      return urlObj.toString();
    } catch (e) {
      return originalUrl;
    }
  }

  static optimizeArray(urls?: string[], size: string = "600x600"): string[] {
    if (!urls || !Array.isArray(urls)) return [];
    return urls.map((url) => this.getOptimizedUrl(url, size) as string);
  }

  /**
   * Scans a document for common image fields (logo, photoURL, coverImage, images array)
   * and returns a new document with optimized WEBP thumbnails injected.
   */
  static transformDocumentImages<T extends Record<string, unknown>>(doc: T, size: string = "400x400"): T {
    if (!doc || typeof doc !== "object") return doc;

    const logo = "logo" in doc && typeof doc.logo === "string" ? doc.logo : undefined;
    const photoURL = "photoURL" in doc && typeof doc.photoURL === "string" ? doc.photoURL : undefined;
    const photo = "photo" in doc && typeof doc.photo === "string" ? doc.photo : undefined;
    const coverImage = "coverImage" in doc && typeof doc.coverImage === "string" ? doc.coverImage : undefined;
    const images = "images" in doc && Array.isArray(doc.images) ? doc.images as string[] : undefined;

    return {
      ...doc,
      ...(logo && { logo }),
      ...(photoURL && {
        photoURL: this.getOptimizedUrl(photoURL, size),
      }),
      ...(photo && { photo: this.getOptimizedUrl(photo, size) }),
      ...(coverImage && {
        coverImage: this.getOptimizedUrl(coverImage, "800x600"),
      }),
      ...(images && {
        images: this.optimizeArray(images, "800x600"),
      }),
    };
  }
}
