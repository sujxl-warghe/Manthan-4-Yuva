const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("vs_token");
}

export function setToken(token: string) {
  if (typeof window !== "undefined") window.localStorage.setItem("vs_token", token);
}

export function clearToken() {
  if (typeof window !== "undefined") window.localStorage.removeItem("vs_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const json = await rawFetch(path, options);
  return json.data ?? json;
}

async function requestRaw<T>(path: string, options: RequestInit = {}): Promise<T> {
  const json = await rawFetch(path, options);
  return json as T;
}

async function rawFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, cache: "no-store" });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(json.message || "Request failed", res.status, json.error_code);
  }
  return json;
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  getPaginated: <T,>(path: string) => requestRaw<PaginatedResponse<T>>(path),
  post: <T,>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T,>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  del: <T,>(path: string) => request<T>(path, { method: "DELETE" }),
};

export { API_BASE };

// ---- Types ----
export interface Tree {
  id: string;
  tree_code: string;
  species: string | null;
  category: string | null;
  ward: string | null;
  ward_id: string;
  institution: string | null;
  latitude: number;
  longitude: number;
  address_hint: string | null;
  plantation_date: string;
  status: string;
  risk_level: string;
  last_verified_at: string | null;
  guardian_name?: string | null;
  parent_tree_id: string | null;
  replacement_generation: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: { total: number; page: number; page_size: number };
}

export interface Ward {
  id: string;
  name: string;
  code: string;
  zone: string | null;
  trees: number;
  alive: number;
  at_risk: number;
  dead: number;
  survival_rate: number;
  verification_rate: number;
}

export interface PublicStats {
  trees_registered: number;
  trees_surviving: number;
  trees_at_risk: number;
  dead_missing: number;
  tree_guardians: number;
  wards_covered: number;
  survival_rate: number;
  drives: number;
  categories: number;
}
