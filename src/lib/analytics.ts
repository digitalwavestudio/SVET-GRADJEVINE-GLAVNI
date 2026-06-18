export const initGA = (measurementId: string | undefined) => {
  if (!measurementId || typeof window === 'undefined') return;

  if (!window.gtag) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
    window.gtag('js', new Date());
  }

  window.gtag('config', measurementId);
};

export const trackPageView = (url: string) => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (typeof window !== 'undefined' && window.gtag && measurementId) {
    window.gtag('config', measurementId, {
      page_path: url,
    });
  }
};

export const trackEvent = (category: string, action: string, label: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
    });
  }
};
