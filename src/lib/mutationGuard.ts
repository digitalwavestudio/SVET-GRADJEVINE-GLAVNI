export const mutationGuard = <T>(fn: () => Promise<T>): Promise<T> => {
  return fn();
};
