export const initGA = (measurementId: string | undefined) => {
  if (!measurementId || typeof window === 'undefined') return;

  // Check if script is already loaded
  if (!(window as any).gtag) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    (window as any).dataLayer = (window as any).dataLayer || [];
    // eslint-disable-next-line prefer-rest-params
    (window as any).gtag = function(...args: unknown[]) {
      (window as any).dataLayer.push(args);
    };
    (window as any).gtag('js', new Date());
  }

  (window as any).gtag('config', measurementId);
};

export const trackPageView = (url: string) => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (typeof window !== 'undefined' && (window as any).gtag && measurementId) {
    (window as any).gtag('config', measurementId, {
      page_path: url,
    });
  }
};

export const trackEvent = (category: string, action: string, label: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
    });
  }
};
