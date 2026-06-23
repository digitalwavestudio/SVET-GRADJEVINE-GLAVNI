import imageCompression from "browser-image-compression";
import { apiClient } from "@/src/lib/apiClient";
import { getLazyAuth } from '@/src/lib/firebase';

export type CompressionMode =
  | "avatar"
  | "gallery"
  | "magazine_featured"
  | "magazine_gallery";

interface CompressionConfig {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
  fileType: string;
  initialQuality: number;
  alwaysKeepResolution?: boolean;
}

const CONFIGS: Record<CompressionMode, CompressionConfig> = {
  avatar: {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 2000,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: 0.98,
  },
  gallery: {
    maxSizeMB: 0.2, // 200KB max per image
    maxWidthOrHeight: 1280, // Limitiran na 1280px za globalne feed-ove
    useWebWorker: true,
    fileType: "image/webp", // Bezuslovni WebP Format
    initialQuality: 0.8,
  },
  magazine_featured: {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 1400, // Featured slike na 1400px širine
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: 0.82,
  },
  magazine_gallery: {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 1000, // Galerijske slike na 1000px širine
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: 0.75,
  },
};

/**
 * Compresses and crops an image using an HTML5 Canvas to reduce RAM/Storage load on backend
 */
async function optimizeImageWithCanvas(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.8,
  cropMode: boolean = false,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");

      let targetWidth = maxWidth;
      let targetHeight = maxHeight;
      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = img.width;
      let sourceHeight = img.height;

      if (cropMode) {
        // Crop: Cover
        const sourceAspect = sourceWidth / sourceHeight;
        const targetAspect = targetWidth / targetHeight;

        if (sourceAspect > targetAspect) {
          sourceWidth = sourceHeight * targetAspect;
          sourceX = (img.width - sourceWidth) / 2;
        } else {
          sourceHeight = sourceWidth / targetAspect;
          sourceY = (img.height - sourceHeight) / 2;
        }
      } else {
        // Resize: Contain
        if (sourceWidth > maxWidth || sourceHeight > maxHeight) {
          const ratio = Math.min(
            maxWidth / sourceWidth,
            maxHeight / sourceHeight,
          );
          targetWidth = Math.round(sourceWidth * ratio);
          targetHeight = Math.round(sourceHeight * ratio);
        } else {
          targetWidth = sourceWidth;
          targetHeight = sourceHeight;
        }
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No canvas context"));

      ctx.clearRect(0, 0, targetWidth, targetHeight);

      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        targetWidth,
        targetHeight,
      );

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const optimizedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, ".webp"),
              {
                type: "image/webp",
                lastModified: Date.now(),
              },
            );
            resolve(optimizedFile);
          } else reject(new Error("toBlob failed"));
        },
        "image/webp",
        quality,
      );
    };
    img.onerror = () => reject(new Error("Image load error"));
    img.src = url;
  });
}

/**
 * Compresses and uploads an image using backend presigned URLs
 */
export async function uploadImage(
  file: File,
  _path: string, // parameter kept for backward compatibility
  mode: CompressionMode = "gallery",
): Promise<string> {
  try {
    const config = CONFIGS[mode];

    // For avatars, logos, small or branding items, we bypass canvas compression completely
    // to preserve 100% vector/pixel fidelity, ensuring crystal-clear text and logos.
    // Server-side Sharp will then compress and convert to WebP using advanced Lanczos downscaling.
    const isLogoOrAvatar =
        mode === "avatar" ||
        file.type?.includes("svg") ||
        file.size < 1.5 * 1024 * 1024; // If under 1.5MB, preserve original quality for avatars and SVGs

    const compressedFile = isLogoOrAvatar
      ? file
      : await optimizeImageWithCanvas(
          file,
          config.maxWidthOrHeight,
          config.maxWidthOrHeight,
          config.initialQuality,
          false,
        );

    // Get auth token
    const authInst = await getLazyAuth();
    const token = authInst.currentUser
      ? await authInst.currentUser.getIdToken()
      : null;

    // Use Express API for all uploads to secure GCS and Local Disk Fallbacks
    const formData = new FormData();
    formData.append("image", compressedFile, compressedFile.name || "image.webp");
    
    // Map folder based on upload mode
    let folder = "media";
    if (mode === "avatar") {
      folder = "profiles/avatars";
    } else if (mode === "magazine_featured") {
      folder = "magazine/featured";
    } else if (mode === "magazine_gallery") {
      folder = "magazine/gallery";
    } else if (mode === "gallery") {
      folder = "ads/gallery";
    }
    formData.append("folder", folder);

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch("/api/media/upload", {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      let errDesc;
      try {
        const parsed = JSON.parse(errText);
        errDesc = parsed.message || parsed.error;
      } catch {
        errDesc = errText;
      }
      throw new Error(errDesc || "Neuspešno direktno otpremanje slike preko servera");
    }

    const data = await response.json();
    return data.url;
  } catch (error: any) {
    console.error("Error during image upload:", error);
    throw new Error(error.message || "Neuspešno otpremanje slike. Probajte ponovo.");
  }
}

/**
 * Batch upload for multiple images
 */
export async function uploadImages(
  files: File[],
  path: string,
  mode: CompressionMode = "gallery",
): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadImage(file, path, mode));
  return Promise.all(uploadPromises);
}
