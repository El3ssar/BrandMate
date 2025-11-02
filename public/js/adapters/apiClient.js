import { state } from "../state.js";

async function requestJSON(url, options = {}) {
  const { method = "GET", body, headers = {} } = options;
  const init = {
    method,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...headers
    }
  };

  if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const resp = await fetch(url, init);
  if (resp.status === 204) return null;
  if (!resp.ok) {
    let message = `${resp.status}`;
    try {
      const errorData = await resp.json();
      if (errorData?.error) {
        message += ` ${errorData.error}`;
      }
    } catch (e) {
      const text = await resp.text();
      if (text) message += ` ${text}`;
    }
    throw new Error(message.trim());
  }
  const contentType = resp.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return resp.json();
  }
  return resp.text();
}

export async function apiDestill({ labelDescription, images }) {
  return requestJSON("/api/destill", {
    method: "POST",
    body: {
      provider: state.provider,
      labelDescription,
      images
    }
  });
}

export async function apiReview({ brandGuidelines, visualAnalysis, labelDescription, reviewQuery, assets }) {
  return requestJSON("/api/review", {
    method: "POST",
    body: {
      provider: state.provider,
      brandGuidelines,
      visualAnalysis,
      labelDescription,
      reviewQuery,
      assets
    }
  });
}

export function apiRegister({ email, password }) {
  return requestJSON("/api/auth/register", {
    method: "POST",
    body: { email, password }
  });
}

export function apiLogin({ email, password }) {
  return requestJSON("/api/auth/login", {
    method: "POST",
    body: { email, password }
  });
}

export function apiLogout() {
  return requestJSON("/api/auth/logout", { method: "POST" });
}

export function apiCurrentUser() {
  return requestJSON("/api/auth/me");
}

export async function apiFetchWorkspaces() {
  const data = await requestJSON("/api/workspaces");
  return data?.workspaces ?? [];
}

export async function apiCreateWorkspace(payload) {
  const data = await requestJSON("/api/workspaces", {
    method: "POST",
    body: payload
  });
  return data?.workspace ?? null;
}

export async function apiUpdateWorkspace(id, payload) {
  const data = await requestJSON(`/api/workspaces/${id}`, {
    method: "PATCH",
    body: payload
  });
  return data?.workspace ?? null;
}

export function apiDeleteWorkspace(id) {
  return requestJSON(`/api/workspaces/${id}`, { method: "DELETE" });
}

export async function apiExportWorkspace(id) {
  return requestJSON(`/api/workspaces/${id}/export`);
}
