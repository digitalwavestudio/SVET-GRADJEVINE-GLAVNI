import React from 'react';
import { useParams } from 'react-router-dom';
import DynamicSEO from '@/src/components/DynamicSEO';

interface Props {
  type?: string;
  applyFilters?: (filters: any) => void;
  seoData?: {
    jsonLd?: any | any[];
    preloads?: Array<{ href: string, as: string, type?: string }>;
  };
}

const withSEOAndFilters = <P extends object>(
  WrappedComponent: React.ComponentType<P>, 
  type: string
) => {
  return (props: P & Props) => {
    const { grad, zanimanje, kategorija } = useParams();

    return (
      <>
        <DynamicSEO 
          type={props.type || type} 
          grad={grad} 
          zanimanje={zanimanje || kategorija} 
          jsonLd={props.seoData?.jsonLd || {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": `${type.charAt(0).toUpperCase() + type.slice(1)} - Svet Građevine`,
            "url": window.location.href
          }}
          preloads={props.seoData?.preloads}
        />
        <WrappedComponent {...props as P} />
      </>
    );
  };
};

export default withSEOAndFilters;
