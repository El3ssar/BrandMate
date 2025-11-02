import { apiDestill } from "./apiClient.js";

export async function runDistill({ labelDescription, images }) {
  const { ok, text, error } = await apiDestill({ labelDescription, images });
  if (!ok) throw new Error(error || "Fallo en destilación");
  return text;
}

