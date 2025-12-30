export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

type RequestOptions = RequestInit & { authToken?: string; tenantId?: string };

export const apiFetch = async (path: string, opts: RequestOptions = {}) => {
  const headers: HeadersInit = {
    ...(opts.headers || {}),
    "Content-Type": opts.headers?.["Content-Type"] || "application/json",
  };
  if (opts.authToken) headers["Authorization"] = `Token ${opts.authToken}`;
  if (opts.tenantId) headers["X-Tenant-ID"] = opts.tenantId;
  const resp = await fetch(`${API_BASE}${path}`, { ...opts, headers, credentials: "include" });
  if (resp.status === 401) {
    const error = new Error("unauthorized");
    // attach marker for handlers
    (error as any).code = 401;
    throw error;
  }
  return resp;
};
