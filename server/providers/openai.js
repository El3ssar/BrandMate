import fetch from "node-fetch";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

function getOpenAIKey() {
  return process.env.OPENAI_API_KEY;
}

function getOpenAIModel() {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

function toImagePart(img) {
  // OpenAI acepta data URLs
  return {
    type: "image_url",
    image_url: { url: `data:${img.mimeType};base64,${img.data}` }
  };
}

export async function destillWithOpenAI({ labelDescription, images, pdfTexts = [] }) {
  const apiKey = getOpenAIKey();
  const model = getOpenAIModel();
  
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured. Please set it in your .env file.");
  }

  // Build PDF context if available
  let pdfContext = '';
  if (pdfTexts && pdfTexts.length > 0) {
    pdfContext = '\n\n--- DESIGN SYSTEM PDFs (Texto Extraído) ---\n';
    pdfTexts.forEach((pdf, index) => {
      pdfContext += `\n**${pdf.name}**\n${pdf.text}\n`;
    });
    pdfContext += '\n--- FIN PDFs ---\n';
  }

  const systemPrompt = `
Eres un **Destilador de Guías de Marca Visual Experto**. Analiza las imágenes y el contenido de PDFs para crear reglas de marca completas y MUY detalladas.

ESTRUCTURA OBLIGATORIA (sé extremadamente específico):

1. **TIPOGRAFÍA**:
   - Familias tipográficas exactas con pesos
   - Tamaños mínimos/máximos por elemento
   - Espaciado entre letras, líneas
   - Casos de uso específicos

2. **PALETA DE COLORES**:
   - Códigos HEX/RGB exactos
   - Jerarquía de colores (primario, secundario, acento)
   - Proporciones de uso
   - Combinaciones permitidas/prohibidas

3. **COMPOSICIÓN Y LAYOUT**:
   - Grids, márgenes, espaciado
   - Jerarquía visual
   - Alineación estándar

4. **ESTILO FOTOGRÁFICO/VISUAL**:
   - Tipo de fotografía, iluminación, mood
   - Composición, elementos requeridos

5. **LOGOTIPO Y GRÁFICOS**:
   - Posiciones, tamaños, clear space
   - Variantes permitidas

6. **PRODUCTO** (usa: "${labelDescription}"):
   - Especificaciones exactas de versiones
   
7. **ACCESIBILIDAD**:
   - Contraste mínimo, legibilidad

NO introducción. MÁXIMO detalle posible.
`.trim();

  const instructionText = pdfContext 
    ? `Analiza las imágenes Y el contenido de los PDFs. Genera reglas extremadamente detalladas.\n\nContexto de PDFs:${pdfContext}`
    : "Genera el documento de reglas según la estructura con máximo detalle.";

  const userContent = [
    ...images.map(toImagePart),
    { type: "text", text: instructionText }
  ];

  const payload = {
    model: model,
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
      "Authorization": `Bearer ${apiKey}`
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

export async function reviewWithOpenAI({ brandGuidelines, visualAnalysis, labelDescription, reviewQuery, assets, visualContext = [] }) {
  const apiKey = getOpenAIKey();
  const model = getOpenAIModel();
  
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured. Please set it in your .env file.");
  }

  const systemPrompt = `
Eres un **Auditor de Brand Compliance Senior Experto**.

IMPORTANTE: Tienes imágenes de REFERENCIA (ejemplos aprobados de marca, etiquetas correctas/incorrectas).
Compara los assets A REVISAR directamente contra estas REFERENCIAS VISUALES.

Analiza CADA ASSET INDIVIDUALMENTE.

Responde SOLO con JSON:
{
 "overall_score": integer 0..100,
 "overall_verdict": "APROBADO"|"REQUIERE_AJUSTES"|"RECHAZADO",
 "asset_reviews": [
   {
     "asset_index": integer,
     "asset_name": string,
     "score": integer 0..100,
     "verdict": "APROBADO"|"REQUIERE_AJUSTES"|"RECHAZADO",
     "summary": string,
     "findings": [
       {
         "finding_type": "CUMPLIMIENTO"|"INFRACCION",
         "module": "Visual"|"Tipografia"|"Legal/Tono"|"Producto"|"Accesibilidad"|"Composicion",
         "description": string,
         "severity": "CRITICAL"|"HIGH"|"MEDIUM"|"LOW"|"N/A",
         "feedback": string
       }
     ]
   }
 ]
}

Compara directamente con las imágenes de referencia.
Si hay "CRITICAL", overall_score <= 50.
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

--- ARCHIVOS RECIBIDOS ---
Primeras ${visualContext.length} imágenes = REFERENCIAS APROBADAS
Últimas ${assets.length} imágenes = ASSETS A REVISAR (en orden):
${assetNameMapping}

IMPORTANTE: En tu respuesta JSON, para cada asset usa el "asset_name" EXACTO de la lista anterior.
Compara los assets contra las referencias visuales directamente.
  `.trim();

  // CRITICAL: Send visual context (examples, labels) FIRST, then assets to review
  const userContent = [
    ...visualContext.map(toImagePart),  // Reference images FIRST
    ...assets.map(toImagePart),          // Assets to review AFTER
    { type: "text", text: `INSTRUCCIÓN: ${reviewQuery}\n\nContexto:\n${contextBlock}\nDevuelve SOLO JSON.` }
  ];

  const payload = {
    model: model,
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
      "Authorization": `Bearer ${apiKey}`
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

