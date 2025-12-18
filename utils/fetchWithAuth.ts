// utils/fetchWithAuth.ts

export const fetchWithAuth = async (
  input: RequestInfo,
  init: RequestInit = {}
): Promise<Response> => {
  return fetch(input, {
    ...init,
    credentials: "include", // very important to send cookies
  });
};
