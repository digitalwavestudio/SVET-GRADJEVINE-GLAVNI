import { firestoreTelemetry } from './firestoreTelemetry';
import { circuitBreaker } from './circuitBreaker';

/**
 * Enterprise Observability Aggregator
 * Provides a unified view of system health and performance
 */
export const observability = {
  getFirestoreHealth: () => {
    const stats = firestoreTelemetry.getSnapshot();
    const isAbusive = stats.reads > 500; 
    const slowCount = stats.slowQueries.length;
    const missingIndexCount = stats.missingIndexes.length;
    
    let advice = 'Optimal performance detected.';
    if (isAbusive) advice = 'Critical: High read volume detected. Check for infinite loops or missing cache.';
    else if (slowCount > 0) advice = 'Slow queries detected. Consider adding missing indexes or optimizing filters.';
    else if (missingIndexCount > 0) advice = 'Missing compound indexes. Check the Query Auditor for direct Google Console links.';

    return {
      reads: stats.reads,
      writes: stats.writes,
      activeListeners: stats.listeners,
      cacheHitRate: stats.reads > 0 ? (stats.cacheHits / stats.reads) : 1,
      isAbusive,
      slowQueries: slowCount,
      missingIndexes: missingIndexCount,
      potentialOptimization: advice
    };
  },
  
  getNetworkHealth: () => {
    return {
      isCircuitTripped: circuitBreaker.isTripped('global'),
      failureCount: circuitBreaker.getSnapshot().failedRequests,
      successCount: circuitBreaker.getSnapshot().successfulRequests
    };
  },
  
  getSystemAudit: () => {
    const fs = observability.getFirestoreHealth();
    const net = observability.getNetworkHealth();
    
    return {
      timestamp: new Date().toISOString(),
      status: net.isCircuitTripped ? 'DEGRADED' : (fs.isAbusive ? 'WARNING' : 'HEALTHY'),
      metrics: { fs, net }
    };
  }
};
