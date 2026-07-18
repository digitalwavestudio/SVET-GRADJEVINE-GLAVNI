import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { APP_CONFIG } from '@/src/constants/config';

interface Props {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'job' | 'profile';
  noindex?: boolean;
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
}

export default function SeoHead({
  title,
  description = 'Oglasi u građevinskoj industriji',
  image = `${APP_CONFIG.BASE_URL}/og-image.jpg`,
  url = APP_CONFIG.BASE_URL,
  type = 'website',
  noindex = false,
  jsonLd
}: Props) {
  const fullTitle = useMemo(() => {
    return title.includes('Svet Građevine') ? title : `${title} | Svet Građevine`;
  }, [title]);

  const ldJsonTags = useMemo(() => {
    if (!jsonLd) return null;
    const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
    return items.map((item, idx) => (
      <script key={idx} type="application/ld+json">
        {JSON.stringify(item)}
      </script>
    ));
  }, [jsonLd]);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />

      {/* Hreflang — geo targetiranje Srbija / x-default */}
      <link rel="alternate" hrefLang="sr" href={url} />
      <link rel="alternate" hrefLang="x-default" href={url} />

      {ldJsonTags}
    </Helmet>
  );
}
