/**
 * Centralized Image URL optimization helper.
 * 
 * NOTE: This function ONLY generates a URL with query parameters (e.g., ?w=800&format=webp).
 * It DOES NOT perform image resizing or optimization itself.
 * 
 * INFRASTRUCTURE REQUIREMENT:
 * For this helper to be functional, the backend storage (Firebase Storage, S3) or CDN
 * handling these requests MUST be configured with an image processing service
 * (e.g., Firebase Image Resize extension, Cloudinary, Imgix, or Vercel Image Optimization)
 * that is capable of parsing these parameters and serving the optimized asset.
 */

export const getOptimizedImageUrl = (url: string | undefined, width?: number, quality: number = 80): string => {
  if (!url) return '';
  
  // Example for common image-processing backends/proxies:
  const separator = url.includes('?') ? '&' : '?';
  const params = [];
  if (width) params.push(`w=${width}`);
  params.push(`q=${quality}`);
  params.push(`format=webp`); 
  
  return `${url}${separator}${params.join('&')}`;
};
