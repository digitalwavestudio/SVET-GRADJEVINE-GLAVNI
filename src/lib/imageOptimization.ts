/**
 * Generates responsive srcSet for Firebase Storage images.
 * Uses the Firebase Image Resizing Extension suffix pattern (_WxH.webp).
 * Falls back to the original URL for non-Firebase images.
 */

function transformFirebaseUrl(url: string, size: string): string {
  if (!url.includes("firebasestorage.googleapis.com")) return url;
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split("/");
    const lastSegment = pathSegments[pathSegments.length - 1];
    const decodedSegment = decodeURIComponent(lastSegment);
    if (/_\d+x\d+\.(webp|jpeg|jpg|png|gif)$/i.test(decodedSegment)) return url;
    const lastDotIndex = decodedSegment.lastIndexOf(".");
    if (lastDotIndex === -1) return url;
    const name = decodedSegment.substring(0, lastDotIndex);
    const transformedName = `${name}_${size}.webp`;
    pathSegments[pathSegments.length - 1] = encodeURIComponent(transformedName);
    urlObj.pathname = pathSegments.join("/");
    return urlObj.toString();
  } catch {
    return url;
  }
}

export const SIZES = [
  { width: 200, size: "200x200", descriptor: "200w" },
  { width: 400, size: "400x400", descriptor: "400w" },
  { width: 800, size: "800x800", descriptor: "800w" },
];

export function getResponsiveSrcSet(src: string | undefined): string | undefined {
  if (!src) return undefined;
  if (!src.includes("firebasestorage.googleapis.com")) return src;
  return SIZES.map((s) => `${transformFirebaseUrl(src, s.size)} ${s.descriptor}`).join(", ");
}

export const getOptimizedImageUrl = (url: string | undefined, width?: number, quality: number = 80): string => {
  if (!url) return '';
  const separator = url.includes('?') ? '&' : '?';
  const params = [];
  if (width) params.push(`w=${width}`);
  params.push(`q=${quality}`);
  params.push(`format=webp`);
  return `${url}${separator}${params.join('&')}`;
};
