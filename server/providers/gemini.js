import fetch from "node-fetch";

function getGeminiKey() {
  return process.env.GOOGLE_API_KEY;
}

function getGeminiModel() {
  return process.env.GEMINI_MODEL || "gemini-1.5-flash";
}

function getGeminiURL() {
  const model = getGeminiModel();
  const key = getGeminiKey();
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key || "")}`;
}

function makeInlineParts(files) {
  // Gemini supports both images AND PDFs natively via inlineData
  return files.map(f => ({
    inlineData: { mimeType: f.mimeType, data: f.data }
  }));
}

export async function destillWithGemini({ labelDescription, files }) {
  const apiKey = getGeminiKey();
  
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is not configured. Please set it in your .env file.");
  }

  // Gemini can handle PDFs natively, so we pass all files (images + PDFs) directly
  const systemPrompt = `
Eres un **Destilador de Guías de Marca Visual Experto**. Analiza TODOS los archivos proporcionados (PDFs e imágenes) para crear reglas de marca completas y detalladas.

ESTRUCTURA OBLIGATORIA (sé muy específico y detallado):

1. **TIPOGRAFÍA** (analiza PDFs e imágenes):
   - Familias tipográficas exactas (nombres completos)
   - Tamaños mínimos y máximos para titulares, subtítulos, cuerpo
   - Pesos (weights) permitidos
   - Espaciado entre letras y líneas
   - Casos de uso específicos

2. **PALETA DE COLORES** (extrae de PDFs e imágenes):
   - Colores primarios con códigos HEX/RGB exactos
   - Colores secundarios y de acento
   - Colores de fondo permitidos
   - Proporciones de uso
   - Combinaciones prohibidas

3. **COMPOSICIÓN Y LAYOUT**:
   - Patrones de grid (columnas, márgenes, gutters)
   - Espaciado y padding estándar
   - Jerarquía visual
   - Alineación y balance
   - Zonas prohibidas

4. **ESTILO FOTOGRÁFICO/VISUAL**:
   - Tipo de fotografía (lifestyle, producto, editorial)
   - Iluminación y mood
   - Composición de imágenes
   - Filtros o tratamiento de color
   - Elementos que deben/no deben aparecer

5. **LOGOTIPO Y GRÁFICOS**:
   - Posicionamiento del logo (ubicaciones, tamaños)
   - Espacio de protección (clear space)
   - Variantes permitidas (color, monocromo, etc.)
   - Usos incorrectos a evitar
   - Elementos gráficos de soporte

6. **REGLAS CRÍTICAS DE PRODUCTO** (usa: "${labelDescription}"):
   - Especificaciones exactas de etiquetas/versiones
   - Elementos obligatorios
   - Diferencias entre versiones correctas e incorrectas

7. **REGLAS DE ACCESIBILIDAD**:
   - Contraste mínimo de texto
   - Tamaños de texto legibles
   - Indicadores visuales claros

NO incluyas introducción. Solo el documento de reglas detallado y específico. Cuanto más detalle, mejor para el auditor posterior.
`.trim();

  const parts = [
    ...makeInlineParts(files), 
    { text: "Analiza TODOS los archivos (PDFs e imágenes) y genera el documento de reglas según la estructura detallada." }
  ];

  const payload = {
    contents: [{ role: "user", parts }],
    systemInstruction: { parts: [{ text: systemPrompt }] }
  };

  const resp = await fetch(getGeminiURL(), {
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

// Streaming version
export async function destillWithGeminiStream({ labelDescription, files }, onChunk) {
  const apiKey = getGeminiKey();
  
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is not configured. Please set it in your .env file.");
  }

  const systemPrompt = `
Eres un **Destilador de Guías de Marca Visual Experto**. Analiza TODOS los archivos proporcionados (PDFs e imágenes) para crear reglas de marca completas y detalladas.

ESTRUCTURA OBLIGATORIA (sé muy específico y detallado):

1. **TIPOGRAFÍA** (analiza PDFs e imágenes):
   - Familias tipográficas exactas (nombres completos)
   - Tamaños mínimos y máximos para titulares, subtítulos, cuerpo
   - Pesos (weights) permitidos
   - Espaciado entre letras y líneas
   - Casos de uso específicos

2. **PALETA DE COLORES** (extrae de PDFs e imágenes):
   - Colores primarios con códigos HEX/RGB exactos
   - Colores secundarios y de acento
   - Colores de fondo permitidos
   - Proporciones de uso
   - Combinaciones prohibidas

3. **COMPOSICIÓN Y LAYOUT**:
   - Patrones de grid (columnas, márgenes, gutters)
   - Espaciado y padding estándar
   - Jerarquía visual
   - Alineación y balance
   - Zonas prohibidas

4. **ESTILO FOTOGRÁFICO/VISUAL**:
   - Tipo de fotografía (lifestyle, producto, editorial)
   - Iluminación y mood
   - Composición de imágenes
   - Filtros o tratamiento de color
   - Elementos que deben/no deben aparecer

5. **LOGOTIPO Y GRÁFICOS**:
   - Posicionamiento del logo (ubicaciones, tamaños)
   - Espacio de protección (clear space)
   - Variantes permitidas (color, monocromo, etc.)
   - Usos incorrectos a evitar
   - Elementos gráficos de soporte

6. **REGLAS CRÍTICAS DE PRODUCTO** (usa: "${labelDescription}"):
   - Especificaciones exactas de etiquetas/versiones
   - Elementos obligatorios
   - Diferencias entre versiones correctas e incorrectas

7. **REGLAS DE ACCESIBILIDAD**:
   - Contraste mínimo de texto
   - Tamaños de texto legibles
   - Indicadores visuales claros

NO incluyas introducción. Solo el documento de reglas detallado y específico. Cuanto más detalle, mejor para el auditor posterior.
`.trim();

  const parts = [
    ...makeInlineParts(files), 
    { text: "Analiza TODOS los archivos (PDFs e imágenes) y genera el documento de reglas según la estructura detallada." }
  ];

  const payload = {
    contents: [{ role: "user", parts }],
    systemInstruction: { parts: [{ text: systemPrompt }] }
  };

  const streamURL = getGeminiURL().replace(':generateContent', ':streamGenerateContent');
  const resp = await fetch(streamURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Gemini stream error: ${resp.status} ${t}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim() && line.startsWith('[')) {
        try {
          const chunks = JSON.parse(line);
          for (const chunk of chunks) {
            const text = chunk?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              onChunk(text);
            }
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}

export async function reviewWithGemini({ brandGuidelines, visualAnalysis, labelDescription, reviewQuery, assets, visualContext = [] }) {
  const apiKey = getGeminiKey();
  
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is not configured. Please set it in your .env file.");
  }

  const systemPrompt = `
Eres un **Auditor de Brand Compliance Senior Experto**. 

IMPORTANTE: Tienes acceso a:
1. El PDF del design system completo
2. Ejemplos APROBADOS de uso correcto de marca
3. Ejemplos de etiquetas correctas e incorrectas
4. Las reglas textuales destiladas

Compara los assets A REVISAR directamente contra TODOS estos materiales de referencia visual.
NO te limites solo al texto destilado - MIRA las referencias visuales directamente.

Analiza CADA ASSET INDIVIDUALMENTE y proporciona feedback específico.

Responde SOLO con JSON del esquema:
{
 "overall_score": integer 0..100,
 "overall_verdict": "APROBADO"|"REQUIERE_AJUSTES"|"RECHAZADO",
 "asset_reviews": [
   {
     "asset_index": integer (0, 1, 2...),
     "asset_name": string (si está disponible),
     "score": integer 0..100,
     "verdict": "APROBADO"|"REQUIERE_AJUSTES"|"RECHAZADO",
     "summary": string (resumen breve del asset),
     "findings": [
       {
         "finding_type": "CUMPLIMIENTO"|"INFRACCION",
         "module": "Visual"|"Tipografia"|"Legal/Tono"|"Producto"|"Accesibilidad"|"Composicion",
         "description": string (detallado y específico),
         "severity": "CRITICAL"|"HIGH"|"MEDIUM"|"LOW"|"N/A",
         "feedback": string (acción correctiva específica)
       }
     ]
   }
 ]
}

Para cada asset, compara visualmente con los ejemplos aprobados y revisa:
- Tipografía (fuentes, tamaños, jerarquía) - compara con PDF y ejemplos
- Colores (paleta, proporciones, contraste) - verifica contra ejemplos
- Composición (layout, espaciado, alineación) - similar a ejemplos aprobados?
- Logo (posición, tamaño, clear space) - como en los ejemplos?
- Legal (disclaimers obligatorios) - verifica en PDF
- Producto (versión correcta, etiquetas) - compara con ejemplos de etiquetas
- Accesibilidad (legibilidad, contraste)

Si hay "CRITICAL" en cualquier asset, overall_score <= 50.
`.trim();

  // Build explicit asset name mapping for the LLM
  const assetNameMapping = assets.map((asset, idx) => 
    `  - Asset ${idx}: "${asset.name || `asset-${idx}`}"`
  ).join('\n');

  const contextBlock = `
--- Guías de Marca (Texto) ---
${brandGuidelines}

--- Análisis Visual Destilado ---
${visualAnalysis}

--- Reglas de Producto ---
${labelDescription}

--- ESTRUCTURA DE ARCHIVOS ---
Primeros ${visualContext.length} archivos = REFERENCIAS (design system, ejemplos aprobados, etiquetas)
Últimos ${assets.length} archivos = ASSETS A REVISAR (en orden):
${assetNameMapping}

IMPORTANTE: En tu respuesta JSON, para cada asset usa el "asset_name" EXACTO de la lista anterior.
Compara los assets a revisar contra TODAS las referencias visuales proporcionadas.
  `.trim();

  // CRITICAL: Send visual context FIRST, then assets to review
  const parts = [
    ...makeInlineParts(visualContext),  // Reference materials FIRST
    ...makeInlineParts(assets),         // Assets to review AFTER
    { text: `INSTRUCCIÓN: ${reviewQuery}\n\nAnaliza CADA ASSET (los últimos ${assets.length}) INDIVIDUALMENTE comparándolos contra las REFERENCIAS VISUALES (los primeros ${visualContext.length} archivos).\n\nContexto Textual:\n${contextBlock}\n\nDevuelve SOLO JSON con el esquema especificado.` }
  ];

  const payload = {
    contents: [{ role: "user", parts }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  const resp = await fetch(getGeminiURL(), {
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

