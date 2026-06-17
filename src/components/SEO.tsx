import { Helmet } from 'react-helmet-async';
import { APP_CONFIG } from '@/src/constants/config';

interface SEOProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile' | 'job';
  twitterCard?: 'summary' | 'summary_large_image';
  jsonLd?: Record<string, any>;
  noindex?: boolean;
}

export function SEO({
  title,
  description,
  canonicalUrl,
  ogImage = `${APP_CONFIG.BASE_URL}/og-image.jpg`,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  jsonLd,
  noindex = false
}: SEOProps) {
  const fullTitle = title.includes('Svet Građevine') ? title : `${title} | Svet Građevine`;
  const url = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : APP_CONFIG.BASE_URL);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      
      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};
