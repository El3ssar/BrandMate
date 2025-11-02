import { state } from "./state.js";
import { els, renderColorList, setStatus } from "./ui.js";
import { restoreBase64Group } from "./files.js";

export function initializeDefaults() {
  if (state.brandColors.length === 0) {
    addColor("Principal", "#1E3A8A");
    addColor("Secundario", "#FBBF24");
  }
}

export function addColor(name, hex) {
  const colorName = (name ?? els.newColorName.value).trim();
  let colorHex = (hex ?? els.newColorHex.value).trim().toUpperCase();
  if (!colorName || !/^#([0-9A-F]{3}){1,2}$/i.test(colorHex)) return;
  if (state.brandColors.some(c => c.hex === colorHex)) return;
  state.brandColors.push({ name: colorName, hex: colorHex });
  renderColorList();
  if (!name) {
    els.newColorName.value = "";
    els.newColorHex.value = "#";
    els.newColorHexPicker.value = "#000000";
  }
}

export function getAllConfigData() {
  const colorListString = state.brandColors.map(c => `- **${c.name}:** ${c.hex}`).join("\n");
  const updatedGuidelines = els.brandGuidelines.value.replace(
    /### A\. Paleta de Colores:[\s\S]*?(?=\n##|$)/,
    `### A. Paleta de Colores:\n${colorListString}\n`
  );
  return {
    timestamp: new Date().toISOString(),
    provider: state.provider,
    textGuidelines: updatedGuidelines,
    labelDescription: els.labelDescription.value,
    visualAnalysis: els.visualAnalysisOutput.value,
    brandColors: state.brandColors,
    designSystemPdf: state.designSystemFiles,
    fewShotImages: state.fewShotImages,
    correctLabelImages: state.correctLabelImages,
    incorrectLabelImages: state.incorrectLabelImages
  };
}

export function downloadConfig() {
  try {
    const data = getAllConfigData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "brand_configuracion.json";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus(els.configStatus, "ok", "Configuración descargada con éxito.");
  } catch (e) {
    setStatus(els.configStatus, "err", `ERROR al descargar: ${e.message}`);
  }
}

export function applyConfig(data) {
  els.brandGuidelines.value = data.textGuidelines || els.brandGuidelines.value;
  els.labelDescription.value = data.labelDescription || els.labelDescription.value;
  els.visualAnalysisOutput.value = data.visualAnalysis || "[Reglas Visuales por Generar]";
  state.provider = (data.provider || "gemini");

  state.brandColors = Array.isArray(data.brandColors) ? data.brandColors : [];
  renderColorList();

  state.designSystemFiles = Array.isArray(data.designSystemPdf) ? data.designSystemPdf : [];
  state.fewShotImages = Array.isArray(data.fewShotImages) ? data.fewShotImages : [];
  state.correctLabelImages = Array.isArray(data.correctLabelImages) ? data.correctLabelImages : [];
  state.incorrectLabelImages = Array.isArray(data.incorrectLabelImages) ? data.incorrectLabelImages : [];

  restoreBase64Group(state.designSystemFiles, document.getElementById("designSystemPreview"), "pdf");
  restoreBase64Group(state.fewShotImages, document.getElementById("fewShotPreview"), "image");
  restoreBase64Group(state.correctLabelImages, document.getElementById("correctLabelPreview"), "image");
  restoreBase64Group(state.incorrectLabelImages, document.getElementById("incorrectLabelPreview"), "image");
}

export function wireDownloadLoadButtons() {
  // Descargar
  document.getElementById("btnDownloadConfig").addEventListener("click", downloadConfig);

  // Cargar
  const input = document.getElementById("loadConfigInput");
  document.getElementById("btnLoadConfig").addEventListener("click", () => input.click());
  input.addEventListener("change", (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        applyConfig(data);
        setStatus(document.getElementById("configStatus"), "ok", `Configuración cargada desde ${file.name}.`);
      } catch (e) {
        setStatus(document.getElementById("configStatus"), "err", "JSON inválido o corrupto.");
      }
    };
    reader.readAsText(file);
  });
}

