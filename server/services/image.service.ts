import sharp from "sharp";
import { admin, getDb } from "../config/firebase.ts";
import { v4 as uuidv4 } from "uuid";
import { Logger } from "../utils/logger.ts";

interface ProcessedImage {
  url: string;
  lqip: string;
}

export class ImageService {
  /**
   * Downloads images from Firebase Storage URLs, optimizes them with Sharp (WebP, resize),
   * uploads them back, and updates the Firestore document with the new URLs.
   */
  static async processAdImages(
    collection: string,
    docId: string,
    imageUrls: string[] | undefined,
  ) {
    if (!imageUrls || imageUrls.length === 0) return;

    Logger.withContext().info(
      `[ImageService] Processing ${imageUrls.length} images for ${collection}/${docId}`,
    );
    const db = getDb();

    try {
      const bucket = admin.storage().bucket();
      const updatedUrls: (string | ProcessedImage)[] = [];
      let changed = false;

      for (let i = 0; i < imageUrls.length; i++) {
        const originalUrl = imageUrls[i];

        // Skip if already optimized natively or if it's external (not firebase storage)
        if (
          originalUrl.includes("_optimized") ||
          originalUrl.endsWith(".webp") ||
          !originalUrl.includes("firebasestorage.googleapis.com")
        ) {
          updatedUrls.push(originalUrl);
          continue;
        }

        try {
          changed = true;
          // 1. Fetch raw image buffer
          const response = await fetch(originalUrl);
          if (!response.ok) {
            throw new Error(
              `Failed to fetch image ${originalUrl}: ${response.statusText}`,
            );
          }
          const buffer = Buffer.from(await response.arrayBuffer());

          // 2. Process with Sharp
          const sharpInstance = sharp(buffer);
          
          // Generate main optimized buffer
          const processedBuffer = await sharpInstance
            .clone()
            .resize({
              width: 1200,
              height: 800,
              fit: "inside",
              withoutEnlargement: true,
            })
            .webp({ quality: 80, effort: 4 })
            .toBuffer();

          // Generate LQIP (tiny blurred base64)
          const lqipBuffer = await sharpInstance
            .clone()
            .resize(20, 20, { fit: 'inside' })
            .blur(5)
            .webp({ quality: 20 })
            .toBuffer();
          
          const lqipBase64 = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

          // 3. Upload back to Storage (generate new path)
          const newFileName = `optimized/${collection}/${docId}/${uuidv4()}_optimized.webp`;
          const file = bucket.file(newFileName);

          await file.save(processedBuffer, {
            metadata: {
              contentType: "image/webp",
              metadata: { originalUrl, lqip: lqipBase64 },
            },
          });

          // Make publicly readable to get simple download url (if bucket allows ACL)
          // Since Firebase Storage rules apply, we might just get a signed URL or construct standard Firebase URL
          try {
            await file.makePublic();
          } catch (e) {
            // Ignored if ACL doesn't allow, will construct alt media url
            Logger.withContext().warn(
              `Failed to makePublic(), bucket might have uniform bucket level access. Constructing alt=media URL.`,
            );
          }

          const newUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(newFileName)}?alt=media`;
          updatedUrls.push({ url: newUrl, lqip: lqipBase64 });
        } catch (imgError: unknown) {
          const error = imgError as Error;
          Logger.withContext().error(
            `[ImageService] Error processing single image ${originalUrl}`,
            { error: error.message },
          );
          // Fallback to original url so we don't drop the photo
          updatedUrls.push(originalUrl);
        }
      }

      if (changed) {
        // We might have a mix of strings (fallbacks) and objects (newly optimized)
        // To keep frontend compatible, we'll store high res in 'images' and placeholders in 'imagePlaceholders'
        const finalUrls = updatedUrls.map((item) => typeof item === 'string' ? item : item.url);
        const finalPlaceholders = updatedUrls.map((item) => typeof item === 'string' ? null : item.lqip);

        // Update document
        await db.collection(collection).doc(docId).update({
          images: finalUrls,
          imagePlaceholders: finalPlaceholders.filter((p): p is string => p !== null), // only non-null
          imagesOptimized: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        Logger.withContext().info(
          `[ImageService] Updated document ${collection}/${docId} with ${updatedUrls.length} optimized images.`,
        );
      } else {
        Logger.withContext().info(
          `[ImageService] No optimization needed for ${collection}/${docId}.`,
        );
      }
    } catch (error: unknown) {
      const err = error as Error;
      Logger.withContext().error(
        `[ImageService] Failed to process images for ${collection}/${docId}`,
        { error: err.message },
      );
      throw error; // Let BullMQ retry
    }
  }

  private static getPathFromUrl(url: string): string | null {
    const oIndex = url.indexOf("/o/");
    if (oIndex === -1) return null;
    const qIndex = url.indexOf("?");
    const pathEncoded = url.substring(
      oIndex + 3,
      qIndex !== -1 ? qIndex : url.length,
    );
    return decodeURIComponent(pathEncoded);
  }
}
