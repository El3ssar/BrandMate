import { apiReview } from "./apiClient.js";

export async function runReview({ brandGuidelines, visualAnalysis, labelDescription, reviewQuery, assets }) {
  const { ok, json, error } = await apiReview({ brandGuidelines, visualAnalysis, labelDescription, reviewQuery, assets });
  if (!ok) throw new Error(error || "Fallo en revisión");
  return json;
}

