import DOMPurify from 'isomorphic-dompurify';

/**
 * Robust input sanitization for Svet Građevine platform.
 * Prevents XSS and malicious scripts while allowing basic safe text.
 */
export const sanitizeInput = (input: unknown): string => {
  if (!input && input !== 0) return '';
  const strInput = String(input);
  return DOMPurify.sanitize(strInput, {
    ALLOWED_TAGS: [], // Minimalist – no HTML allowed by default for plain inputs
    ALLOWED_ATTR: [],
  }).trim();
};

/**
 * Allows some safe HTML for rich text fields (e.g., job descriptions).
 */
export const sanitizeRichText = (input: string): string => {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i'],
    ALLOWED_ATTR: ['href', 'target'],
  }).trim();
};
