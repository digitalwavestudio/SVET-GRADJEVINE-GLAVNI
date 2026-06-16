// Web Worker for complex aggregations & metrics

self.onmessage = (e) => {
  const { payload, type, userRole } = e.data;
  
  if (type === 'AGGREGATE_METRICS') {
    const start = performance.now();
    let totalViews = 0;
    let totalSaves = 0;
    const matchScores: number[] = [];

    // Simulate heavy array transformation
    if (Array.isArray(payload)) {
      payload.forEach((item: Record<string, unknown>) => {
        if (item.views) totalViews += (typeof item.views === 'number' ? item.views : 0);
        if (item.saves) totalSaves += (typeof item.saves === 'number' ? item.saves : 0);
        if (typeof item.matchRate === 'number') matchScores.push(item.matchRate);
      });
    }

    let avgMatchRate = 0;
    if (matchScores.length > 0) {
       avgMatchRate = matchScores.reduce((a, b) => a + b, 0) / matchScores.length;
    }

    const end = performance.now();
    
    self.postMessage({ 
      type: 'METRICS_READY', 
      metrics: { 
         totalViews, 
         totalSaves, 
         avgMatchRate: Math.round(avgMatchRate),
         processingTimeMs: Math.round(end - start)
      } 
    });
  }
};
