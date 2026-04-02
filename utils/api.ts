
export const getApiHeaders = (extraHeaders: Record<string, string> = {}): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
};
