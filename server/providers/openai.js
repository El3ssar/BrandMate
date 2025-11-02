import fetch from "node-fetch";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

if (!OPENAI_API_KEY) {
  console.warn("[WARN] OPENAI_API_KEY no configurada: rutas OpenAI fallarán.");
}

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

function toImagePart(img) {
  // OpenAI acepta data URLs
  return {
    type: "image_url",
    image_url: { url: `data:${img.mimeType};base64,${img.data}` }
  };
}

export async function destillWithOpenAI({ labelDescription, images }) {
  const systemPrompt = `
Eres un Destilador de Guías de Marca Visual. Resume reglas para sustituir referencias gráficas.
Estructura:
1. Estilo Fotográfico/Estético.
2. Reglas de Logotipo/Gráficos.
3. Reglas CRÍTICAS de Etiquetas (usa: "${labelDescription}").
Sin introducción; solo el documento de reglas.
`.trim();

  const userContent = [
    ...images.map(toImagePart),
    { type: "text", text: "Genera el documento de reglas según la estructura." }
  ];

  const payload = {
    model: OPENAI_MODEL,
    response_format: { type: "text" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent }
    ]
  };

  const resp = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`OpenAI destill error: ${resp.status} ${t}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() || "ERROR: Sin texto.";
}

export async function reviewWithOpenAI({ brandGuidelines, visualAnalysis, labelDescription, reviewQuery, assets }) {
  const systemPrompt = `
Eres un Auditor de Brand Compliance Senior. Responde SOLO con JSON.
Esquema:
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

  const userContent = [
    ...assets.map(toImagePart),
    { type: "text", text: `INSTRUCCIÓN: ${reviewQuery}\n\nContexto:\n${contextBlock}\nDevuelve SOLO JSON.` }
  ];

  const payload = {
    model: OPENAI_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent }
    ]
  };

  const resp = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`OpenAI review error: ${resp.status} ${t}`);
  }
  const data = await resp.json();
  const msg = data.choices?.[0]?.message?.content || "{}";
  return JSON.parse(msg);
}

