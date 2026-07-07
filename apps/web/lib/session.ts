export type User = {
  id: string;
  email: string;
  display_name: string;
  role: "user" | "admin" | string;
};

const tokenKey = "nuvonode_dashboard_token";

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(tokenKey) || "";
}

export function setToken(token: string) {
  localStorage.setItem(tokenKey, token);
}

export function clearToken() {
  localStorage.removeItem(tokenKey);
}
