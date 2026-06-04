/**
 * Svet Granjevine - Frontend Distributed Tracing (Disabled due to fetch setter conflict)
 */
export const initFrontendTracing = () => {
  // console.log('[OTEL] Tracing Disabled');
};

export const getTracer = (name: string): any => {
  return {
    startActiveSpan: (_name: string, fn: (span: any) => any) => {
      const dummySpan = { setAttributes: () => {}, setAttribute: () => {}, setStatus: () => {}, end: () => {} };
      return fn(dummySpan);
    },
    startSpan: () => ({ setAttributes: () => {}, setAttribute: () => {}, setStatus: () => {}, end: () => {} })
  };
};
