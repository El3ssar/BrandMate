import fetch from "node-fetch";

const GROK_URL = "https://api.x.ai/v1/chat/completions";

function getGrokKey() {
  return process.env.XAI_API_KEY;
}

function getGrokModel() {
  return process.env.GROK_MODEL || "grok-2";
}

// Grok suele ser *OpenAI-compatible*; si tu endpoint difiere, ajusta GROK_URL y payload.
function toImagePart(img) {
  return {
    type: "image_url",
    image_url: { url: `data:${img.mimeType};base64,${img.data}` }
  };
}

export async function destillWithGrok({ labelDescription, images, pdfTexts = [], customPrompt, aiParameters = {} }) {
  const apiKey = getGrokKey();
  const model = getGrokModel();
  
  if (!apiKey) {
    throw new Error("XAI_API_KEY is not configured. Please set it in your .env file.");
  }

  const temperature = aiParameters.temperature ?? 0.7;
  const max_tokens = aiParameters.maxTokens ?? 4096;
  const top_p = aiParameters.topP ?? 1.0;

  // Build PDF context if available
  let pdfContext = '';
  if (pdfTexts && pdfTexts.length > 0) {
    pdfContext = '\n\n--- DESIGN SYSTEM PDFs ---\n';
    pdfTexts.forEach((pdf) => {
      pdfContext += `\n**${pdf.name}**\n${pdf.text}\n`;
    });
    pdfContext += '\n--- FIN PDFs ---\n';
  }

  // Use custom prompt if provided, otherwise use default
  const systemPrompt = customPrompt || `
Eres un **Destilador de Guías de Marca Visual Experto**. Crea reglas MUY detalladas basadas en las imágenes y PDFs.

ESTRUCTURA (máximo detalle):
1. TIPOGRAFÍA: Fuentes exactas, tamaños, pesos, espaciado
2. COLORES: Códigos HEX, proporciones, jerarquía
3. COMPOSICIÓN: Grids, márgenes, alineación
4. ESTILO VISUAL: Fotografía, iluminación, mood
5. LOGOTIPO: Posiciones, tamaños, clear space
6. PRODUCTO: "${labelDescription}"
7. ACCESIBILIDAD: Contraste, legibilidad

NO introducción. MÁXIMO detalle.
`.trim();

  const instructionText = pdfContext 
    ? `Analiza imágenes Y PDFs. Genera reglas extremadamente detalladas.\n\nContexto PDFs:${pdfContext}`
    : "Genera reglas con máximo detalle.";

  const userContent = [
    ...images.map(toImagePart),
    { type: "text", text: instructionText }
  ];

  const payload = {
    model,
    temperature,
    max_tokens,
    top_p,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent }
    ]
  };

  const resp = await fetch(GROK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
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

// Streaming version
export async function destillWithGrokStream({ labelDescription, images }, onChunk) {
  const apiKey = getGrokKey();
  const model = getGrokModel();
  
  if (!apiKey) {
    throw new Error("XAI_API_KEY is not configured.");
  }

  const systemPrompt = `
Eres un **Destilador de Guías de Marca Visual Experto**. Crea reglas MUY detalladas basadas en las imágenes y PDFs.

ESTRUCTURA (máximo detalle):
1. TIPOGRAFÍA: Fuentes exactas, tamaños, pesos, espaciado
2. COLORES: Códigos HEX, proporciones, jerarquía
3. COMPOSICIÓN: Grids, márgenes, alineación
4. ESTILO VISUAL: Fotografía, iluminación, mood
5. LOGOTIPO: Posiciones, tamaños, clear space
6. PRODUCTO: "${labelDescription}"
7. ACCESIBILIDAD: Contraste, legibilidad

NO introducción. MÁXIMO detalle.
`.trim();

  const userContent = [
    ...images.map(toImagePart),
    { type: "text", text: "Genera reglas con máximo detalle." }
  ];

  const payload = {
    model: model,
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent }
    ]
  };

  const resp = await fetch(GROK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Grok stream error: ${resp.status} ${t}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim() !== '');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            onChunk(content);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}

export async function reviewWithGrok({ brandGuidelines, visualAnalysis, labelDescription, reviewQuery, assets, visualContext = [], aiParameters = {} }) {
  const apiKey = getGrokKey();
  const model = getGrokModel();
  
  if (!apiKey) {
    throw new Error("XAI_API_KEY is not configured. Please set it in your .env file.");
  }
  
  const temperature = aiParameters.temperature ?? 0.7;
  const max_tokens = aiParameters.maxTokens ?? 4096;
  const top_p = aiParameters.topP ?? 1.0;

  const systemPrompt = `
Eres un **Auditor de Brand Compliance Senior Experto**.

IMPORTANTE: Tienes imágenes de REFERENCIA (ejemplos aprobados) para comparar directamente.
Analiza CADA ASSET contra estas referencias visuales.

Responde SOLO con JSON:
{
 "overall_score": integer,
 "overall_verdict": "APROBADO"|"REQUIERE_AJUSTES"|"RECHAZADO",
 "asset_reviews": [
   {
     "asset_index": integer,
     "asset_name": string,
     "score": integer,
     "verdict": string,
     "summary": string,
     "findings": [...]
   }
 ]
}

Compara directamente con las imágenes de referencia. Si hay "CRITICAL", overall_score <= 50.
`.trim();

  // Build explicit asset name mapping
  const assetNameMapping = assets.map((asset, idx) => 
    `  - Asset ${idx}: "${asset.name || `asset-${idx}`}"`
  ).join('\n');

  const contextBlock = `
--- Guías de Marca ---
${brandGuidelines}

--- Análisis Visual Destilado ---
${visualAnalysis}

--- Reglas de Producto ---
${labelDescription}

--- ARCHIVOS ---
Primeras ${visualContext.length} imágenes = REFERENCIAS
Últimas ${assets.length} imágenes = ASSETS A REVISAR:
${assetNameMapping}

IMPORTANTE: Usa el "asset_name" EXACTO de la lista en tu respuesta JSON.
  `.trim();

  // Send visual context FIRST, then assets to review
  const userContent = [
    ...visualContext.map(toImagePart),  // Reference images FIRST
    ...assets.map(toImagePart),          // Assets to review AFTER
    { type: "text", text: `INSTRUCCIÓN: ${reviewQuery}\n\nContexto:\n${contextBlock}\nDevuelve SOLO JSON.` }
  ];

  const payload = {
    model,
    temperature,
    max_tokens,
    top_p,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent }
    ]
  };

  const resp = await fetch(GROK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
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

