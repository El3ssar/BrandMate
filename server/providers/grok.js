import fetch from "node-fetch";

const XAI_API_KEY = process.env.XAI_API_KEY;
const GROK_MODEL = process.env.GROK_MODEL || "grok-2";
const GROK_URL = "https://api.x.ai/v1/chat/completions"; // Nota: puede variar según versión del API.

if (!XAI_API_KEY) {
  console.warn("[WARN] XAI_API_KEY no configurada: rutas Grok fallarán.");
}

// Grok suele ser *OpenAI-compatible*; si tu endpoint difiere, ajusta GROK_URL y payload.
function toImagePart(img) {
  return {
    type: "image_url",
    image_url: { url: `data:${img.mimeType};base64,${img.data}` }
  };
}

export async function destillWithGrok({ labelDescription, images }) {
  const systemPrompt = `
Eres un Destilador de Guías de Marca Visual. Estructura:
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
    model: GROK_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent }
    ]
  };

  const resp = await fetch(GROK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${XAI_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Grok destill error: ${resp.status} ${t}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() || "ERROR: Sin texto.";
}

export async function reviewWithGrok({ brandGuidelines, visualAnalysis, labelDescription, reviewQuery, assets }) {
  const systemPrompt = `
Eres un Auditor de Brand Compliance Senior. Devuelve SOLO JSON con el esquema indicado:
{"overall_score":...,"overall_verdict":...,"review_details":[...]}
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
    model: GROK_MODEL,
    // Algunos endpoints Grok aún no soportan response_format: json_object;
    // Por eso parsearemos en frontend/server y validaremos.
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent }
    ]
  };

  const resp = await fetch(GROK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${XAI_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Grok review error: ${resp.status} ${t}`);
  }

  const data = await resp.json();
  const raw = data.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(raw);
  } catch {
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  }
}

