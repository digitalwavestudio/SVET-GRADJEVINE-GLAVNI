export const init = (...args: any[]): any => {};
export const getActiveSpan = (...args: any[]): any => {
  return {
    setAttribute: (...a: any[]) => {},
    end: (...a: any[]) => {}
  };
};
export const startInactiveSpan = (...args: any[]): any => {
  return {
    setAttribute: (...a: any[]) => {},
    end: (...a: any[]) => {}
  };
};
export const startSpan = (options: any, callback: (...args: any[]) => any): any => {
  return callback();
};
export const captureException = (...args: any[]): any => {};
export const captureMessage = (...args: any[]): any => {};
export const setupExpressErrorHandler = (...args: any[]): any => {};
export const withScope = (callback: (scope: any) => void): any => {
  const dummyScope = {
    setTag: (...a: any[]) => {},
    setUser: (...a: any[]) => {},
    setExtra: (...a: any[]) => {}
  };
  callback(dummyScope);
};
