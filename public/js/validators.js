export function ensureVisualAnalysisReady(text) {
  return text && text.trim().length >= 50 && !text.includes("[Reglas Visuales por Generar]");
}

