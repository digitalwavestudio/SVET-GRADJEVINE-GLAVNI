import { apiClient } from '@/src/lib/apiClient';
import { auth } from "@/src/firebase";

interface CompressionConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'image/webp' | 'image/jpeg';
}

export const compressImage = async (
  file: File,
  config: CompressionConfig = {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.75,
    format: 'image/webp',
  }
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');

      let { width, height } = img;
      if (width > config.maxWidth || height > config.maxHeight) {
        const ratio = Math.min(config.maxWidth / width, config.maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Canvas context not available'));
      }

      // Important for webp: fill white background if transparency exists
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Canvas toBlob failed'));

          const extension = config.format === 'image/webp' ? '.webp' : '.jpg';
          const newName = file.name.replace(/\.[^/.]+$/, '') + extension;

          const compressedFile = new File([blob], newName, {
            type: config.format,
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        config.format,
        config.quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
};

/**
 * Kompresija na klijentu i GCS V4 Presigned slanje (Odbacujemo Express Multer / CPU Node.js opt.).
 */
export const uploadImageDirectly = async (file: File): Promise<string> => {
  try {
    // For logos, branding, small, or vector images, bypass local canvas resizing to ensure maximum crispness.
    // Backend Sharp will compress it seamlessly.
    const isLogo = 
      file.name?.toLowerCase().includes("logo") || 
      file.name?.toLowerCase().includes("avatar") || 
      file.type?.includes("svg") || 
      file.size < 1.5 * 1024 * 1024; // If under 1.5MB, preserve original quality entirely
    
    const compressedFile = isLogo
      ? file
      : await compressImage(file, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.82,
          format: 'image/webp',
        });

    // Get auth token
    const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;

    // Use Express API for all uploads to secure GCS and Local Disk Fallbacks
    const formData = new FormData();
    formData.append("image", compressedFile, compressedFile.name || "image.webp");
    formData.append("folder", "media");

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
  } catch (error: unknown) {
    // 14. Capture fallback za Sentry za "tihe padove" na upload flow
    const errorMsg = error instanceof Error ? error.message : String(error);
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'ERROR',
        message: `[UPLOAD FAIL] ${errorMsg}`,
        context: { fileName: file.name, fileSize: file.size, fileType: file.type }
      })
    }).catch(() => console.warn('[ImageCompressor] Log upload failure failed'));
    
    throw error;
  }
};
