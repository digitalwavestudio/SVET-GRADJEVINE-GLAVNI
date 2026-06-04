import { useEffect } from 'react';

interface JsonLdProps {
  data: any;
}

export default function JsonLd({ data }: JsonLdProps) {
  useEffect(() => {
    if (!data) return;
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    
    const id = "json-ld-" + Math.random().toString(36).substring(2, 11);
    script.id = id;
    
    document.head.appendChild(script);
    
    return () => {
      const el = document.getElementById(id);
      if (el) {
        document.head.removeChild(el);
      }
    };
  }, [data]);

  return null;
}
