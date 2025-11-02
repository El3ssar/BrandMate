import { state } from "../state.js";

async function postJSON(url, body) {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`${resp.status} ${t}`);
  }
  return resp.json();
}

export async function apiDestill({ labelDescription, images }) {
  return postJSON("/api/destill", {
    provider: state.provider,
    labelDescription,
    images
  });
}

export async function apiReview({ brandGuidelines, visualAnalysis, labelDescription, reviewQuery, assets }) {
  return postJSON("/api/review", {
    provider: state.provider,
    brandGuidelines,
    visualAnalysis,
    labelDescription,
    reviewQuery,
    assets
  });
}

