import { state } from "./state.js";
import { els, renderThumb, setStatus } from "./ui.js";

const fileMap = {
  designSystemPdf: { arr: () => state.designSystemFiles, preview: () => els.designSystemPreview, kind: "pdf" },
  fewShotImages: { arr: () => state.fewShotImages, preview: () => els.fewShotPreview, kind: "image" },
  correctLabelImages: { arr: () => state.correctLabelImages, preview: () => els.correctLabelPreview, kind: "image" },
  incorrectLabelImages: { arr: () => state.incorrectLabelImages, preview: () => els.incorrectLabelPreview, kind: "image" },
  assetImages: { arr: () => state.reviewAssets, preview: () => els.assetPreview, kind: "image" }
};

export function handleFileInput(inputEl) {
  const id = inputEl.id;
  const meta = fileMap[id];
  if (!meta) return;

  const files = Array.from(inputEl.files || []);
  const target = meta.arr();
  const container = meta.preview();

  target.length = 0;
  container.innerHTML = "";

  if (!files.length) {
    container.innerHTML = `<span class="text-gray-400 text-xs">Nada seleccionado.</span>`;
    return;
  }

  for (const f of files) {
    if (f.type.startsWith("video/")) {
      setStatus(els.processStatus, "err", `Archivo no soportado (video): ${f.name}. Sube un frame.`);
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setStatus(els.processStatus, "warn", `Archivo grande (>10MB): ${f.name}.`);
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      const [header, data] = base64.split(";base64,");
      const mime = header.replace("data:", "");
      target.push({ mimeType: mime, data });
      renderThumb(container, { mimeType: mime, data }, meta.kind);
    };
    reader.readAsDataURL(f);
  }
}

export function restoreBase64Group(array, previewEl, kind) {
  previewEl.innerHTML = "";
  array.forEach(f => renderThumb(previewEl, f, kind));
}

