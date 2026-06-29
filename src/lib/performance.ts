import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const traceAsync = async <T,>(_name: string, fn: () => Promise<T>): Promise<T> => fn();

export const measureFirebaseQuery = <T,>(_collection: string, _operation: string, fn: () => Promise<T>) =>
  fn();

export const trackApiCall = async <T,>(_method: string, _url: string, fn: () => Promise<T>): Promise<T> =>
  fn();

export const measurePageLoad = () => {};

export const usePerformanceNavigation = () => {
  const location = useLocation();
  const ref = useRef(null);
  useEffect(() => {}, [location.pathname]);
};

export function createTrace(_name: string) {
  return { start: () => {}, stop: () => {}, putAttribute: () => {} };
}

export const trackAction = (_name: string, _attributes?: Record<string, string>) => {};
