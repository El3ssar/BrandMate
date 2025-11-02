import fetch from "node-fetch";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY || "")}`;

if (!GEMINI_API_KEY) {
  console.warn("[WARN] GOOGLE_API_KEY no configurada: rutas Gemini fallarán.");
}

function makeInlineParts(images) {
  return images.map(f => ({
    inlineData: { mimeType: f.mimeType, data: f.data }
  }));
}

export async function destillWithGemini({ labelDescription, images }) {
  const systemPrompt = `
Eres un **Destilador de Guías de Marca Visual**. Resume reglas visuales y de producto para reemplazar referencias gráficas.
Estructura obligatoria:
1. Estilo Fotográfico/Estético.
2. Reglas de Logotipo/Gráficos.
3. Reglas CRÍTICAS de Etiquetas (usa: "${labelDescription}").
No introducción; solo el documento de reglas.
`.trim();

  const parts = [...makeInlineParts(images), { text: "Genera el documento de reglas según la estructura." }];

  const payload = {
    contents: [{ role: "user", parts }],
    systemInstruction: { parts: [{ text: systemPrompt }] }
  };

  const resp = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Gemini destill error: ${resp.status} ${t}`);
  }

  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || "ERROR: Sin texto.";
}

export async function reviewWithGemini({ brandGuidelines, visualAnalysis, labelDescription, reviewQuery, assets }) {
  const systemPrompt = `
Eres un **Auditor de Brand Compliance Senior**. Compara los assets con las reglas textuales (guías + análisis destilado).
Responde SOLO con JSON del esquema:
{
 "overall_score": integer 0..100,
 "overall_verdict": "APROBADO"|"REQUIERE_AJUSTES"|"RECHAZADO",
 "review_details": [
   {
     "finding_type": "CUMPLIMIENTO"|"INFRACCION",
     "module": "Visual"|"Tipografia"|"Legal/Tono"|"Producto"|"Accesibilidad",
     "description": string,
     "severity": "CRITICAL"|"HIGH"|"MEDIUM"|"LOW"|"N/A",
     "feedback": string
   }
 ]
}
Si hay "CRITICAL", overall_score <= 50.
`.trim();

  const contextBlock = `
--- Guías de Marca ---
${brandGuidelines}

--- Análisis Visual Destilado ---
${visualAnalysis}

--- Reglas de Producto (extra) ---
${labelDescription}
  `.trim();

  const parts = [
    ...makeInlineParts(assets),
    { text: `INSTRUCCIÓN: ${reviewQuery}\n\nContexto:\n${contextBlock}\nDevuelve SOLO JSON.` }
  ];

  const payload = {
    contents: [{ role: "user", parts }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  const resp = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Gemini review error: ${resp.status} ${t}`);
  }

  const data = await resp.json();
  const jsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  try {
    return JSON.parse(jsonText);
  } catch {
    // fallback: intenta limpiar bloque de ```json
    const clean = jsonText.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  }
}

