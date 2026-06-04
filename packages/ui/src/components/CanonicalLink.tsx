import React, { useEffect } from 'react';

interface CanonicalLinkProps {
  url: string;
}

/**
 * Handles canonical link injection to prevent duplicate content SEO penalties.
 * Essential for routes with multiple parameters or slug variations.
 */
export const CanonicalLink = ({ url }: CanonicalLinkProps) => {
  useEffect(() => {
    // Remove existing canonical links
    const existingLinks = document.querySelectorAll('link[rel="canonical"]');
    existingLinks.forEach(link => link.remove());

    // Create and add new canonical link
    const link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    document.head.appendChild(link);

    return () => {
      link.remove();
    };
  }, [url]);

  return null;
};
