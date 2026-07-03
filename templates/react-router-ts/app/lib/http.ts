import ky from "ky";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");

export const http = ky.create({
  prefix: apiBaseUrl || undefined,
  retry: {
    limit: 1,
  },
  timeout: 10_000,
});

export async function getJson<TResponse>(path: string) {
  return http.get(path).json<TResponse>();
}
