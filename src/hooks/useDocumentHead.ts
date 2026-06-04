import { useEffect } from 'react';

interface HeadMeta {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: string;
  jsonLd?: any | any[];
  noindex?: boolean;
}

export function useDocumentHead({
  title,
  description,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  twitterCard,
  jsonLd,
  noindex
}: HeadMeta) {
  useEffect(() => {
    if (title) document.title = title;

    const setMeta = (name: string, content: string | undefined, isProperty = false) => {
      if (!content) return;
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector);
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    setMeta('description', description);
    setMeta('og:title', ogTitle || title, true);
    setMeta('og:description', ogDescription || description, true);
    setMeta('og:image', ogImage, true);
    setMeta('og:url', ogUrl, true);
    setMeta('twitter:card', twitterCard || 'summary_large_image');
    setMeta('twitter:title', ogTitle || title);
    setMeta('twitter:description', ogDescription || description);
    
    if (noindex) {
      setMeta('robots', 'noindex, nofollow');
    } else {
      const robots = document.querySelector('meta[name="robots"]');
      if (robots && robots.getAttribute('content') === 'noindex, nofollow') {
        robots.remove();
      }
    }

    let jsonLdScript = document.getElementById('dynamic-json-ld') as HTMLScriptElement;
    if (jsonLd) {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.id = 'dynamic-json-ld';
        jsonLdScript.type = 'application/ld+json';
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.textContent = JSON.stringify(jsonLd);
    } else if (jsonLdScript) {
      jsonLdScript.remove();
    }

  }, [title, description, ogTitle, ogDescription, ogImage, ogUrl, twitterCard, jsonLd, noindex]);
}
