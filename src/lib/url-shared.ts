/**
 * Standardized slugify logic for Svet Gradjevine platform.
 * Handles Serbian Cyrillic/Latin characters.
 */
export function slugify(text: string): string {
  const cyrillicToLatin: { [key: string]: string } = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'ђ': 'dj', 'е': 'e', 'ж': 'z', 'з': 'z',
    'и': 'i', 'ј': 'j', 'к': 'k', 'л': 'l', 'љ': 'lj', 'м': 'm', 'н': 'n', 'њ': 'nj', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'ћ': 'c', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c',
    'ч': 'c', 'џ': 'dz', 'ш': 's',
    'ć': 'c', 'č': 'c', 'đ': 'dj', 'š': 's', 'ž': 'z',
  };

  let str = text.toLowerCase();
  
  // Convert Cyrillic and special characters
  str = str.split('').map(char => cyrillicToLatin[char] || char).join('');

  return str
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/-+/g, '-')      // Replace multiple -
    .trim();
}

/**
 * Builds a standardized SEO job URL.
 */
export function buildJobUrl(job: { title: string, id: string | undefined }): string {
  if (!job.id) return '/poslovi';
  return `/posao/${slugify(job.title)}-${job.id}`;
}
