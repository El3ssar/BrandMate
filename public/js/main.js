import { state } from "./state.js";
import { els, setStatus, hide, show, renderColorList, renderAuditCard } from "./ui.js";
import { handleFileInput } from "./files.js";
import { initializeDefaults, addColor, getAllConfigData, wireDownloadLoadButtons } from "./storage.js";
import { ensureVisualAnalysisReady } from "./validators.js";
import { runDistill } from "./adapters/distill.js";
import { runReview } from "./adapters/review.js";

function injectPaletteIntoGuidelines() {
  const colors = state.brandColors.map(c => `- **${c.name}:** ${c.hex}`).join("\n");
  const current = els.brandGuidelines.value;
  els.brandGuidelines.value = current.replace(
    /### A\. Paleta de Colores:[\s\S]*?(?=\n##|$)/,
    `### A. Paleta de Colores:\n${colors}\n`
  );
}

function wireInputs() {
  // Provider
  els.providerSelect.addEventListener("change", () => {
    state.provider = els.providerSelect.value;
    setStatus(els.configStatus, "info", `Proveedor seleccionado: ${state.provider}`);
  });

  // Color add
  els.btnAddColor.addEventListener("click", () => {
    const name = els.newColorName.value.trim();
    const hex = els.newColorHex.value.trim().toUpperCase();
    if (!hex) els.newColorHex.value = els.newColorHexPicker.value.toUpperCase();
    addColor(name, hex || els.newColorHexPicker.value.toUpperCase());
  });

  // Sync color text with picker
  els.newColorHexPicker.addEventListener("input", () => {
    els.newColorHex.value = els.newColorHexPicker.value.toUpperCase();
  });

  // Files
  [
    els.designSystemPdf,
    els.fewShotImages,
    els.correctLabelImages,
    els.incorrectLabelImages,
    els.assetImages
  ].forEach(input => input.addEventListener("change", () => handleFileInput(input)));

  // Download/Load
  wireDownloadLoadButtons();

  // Destill
  els.btnDestill.addEventListener("click", async () => {
    try {
      show(els.processStatus);
      setStatus(els.processStatus, "info", "Analizando contexto visual...");
      els.btnDestill.disabled = true;

      const contextImages = [
        ...state.designSystemFiles,
        ...state.fewShotImages,
        ...state.correctLabelImages,
        ...state.incorrectLabelImages
      ];
      if (contextImages.length === 0) {
        setStatus(els.processStatus, "err", "Carga imágenes en 1.2 y 1.3 antes de destilar.");
        els.btnDestill.disabled = false;
        return;
      }

      const text = await runDistill({
        labelDescription: els.labelDescription.value,
        images: contextImages
      });

      els.visualAnalysisOutput.value = text || "[ERROR al generar reglas]";
      setStatus(els.processStatus, "ok", "Destilación completada.");
    } catch (e) {
      setStatus(els.processStatus, "err", `ERROR en destilación: ${e.message}`);
    } finally {
      els.btnDestill.disabled = false;
    }
  });

  // Review
  els.btnReview.addEventListener("click", async () => {
    try {
      hide(els.errorMessage);
      els.resultContainer.innerHTML = "";
      els.btnReview.disabled = true;
      els.reviewText.classList.add("hidden");
      els.reviewIcon.classList.add("hidden");
      els.loading.classList.remove("hidden");

      if (state.reviewAssets.length === 0) {
        els.errorMessage.textContent = "Sube al menos un asset en 2.";
        els.errorMessage.classList.remove("hidden");
        return;
      }

      if (!ensureVisualAnalysisReady(els.visualAnalysisOutput.value)) {
        els.errorMessage.textContent = "Primero destila reglas visuales (1.4).";
        els.errorMessage.classList.remove("hidden");
        return;
      }

      injectPaletteIntoGuidelines();

      const result = await runReview({
        brandGuidelines: els.brandGuidelines.value,
        visualAnalysis: els.visualAnalysisOutput.value,
        labelDescription: els.labelDescription.value,
        reviewQuery: els.reviewQuery.value,
        assets: state.reviewAssets
      });

      els.resultContainer.innerHTML = renderAuditCard(result);

    } catch (e) {
      els.errorMessage.textContent = `Error en la revisión: ${e.message}`;
      els.errorMessage.classList.remove("hidden");
    } finally {
      els.btnReview.disabled = false;
      els.reviewText.classList.remove("hidden");
      els.reviewIcon.classList.remove("hidden");
      els.loading.classList.add("hidden");
    }
  });
}

function boot() {
  state.provider = els.providerSelect.value;
  initializeDefaults();
  renderColorList();
  setStatus(els.configStatus, "info", "Sistema listo. Carga/ajusta la configuración.");
}

wireInputs();
boot();

