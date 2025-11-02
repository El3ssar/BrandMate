import { state } from "./state.js";

export const els = {
  providerSelect: document.getElementById("providerSelect"),
  configStatus: document.getElementById("configStatus"),
  processStatus: document.getElementById("processStatus"),
  btnLoadConfig: document.getElementById("btnLoadConfig"),
  loadConfigInput: document.getElementById("loadConfigInput"),
  btnDownloadConfig: document.getElementById("btnDownloadConfig"),
  btnAddColor: document.getElementById("btnAddColor"),
  colorList: document.getElementById("colorList"),
  newColorName: document.getElementById("newColorName"),
  newColorHex: document.getElementById("newColorHex"),
  newColorHexPicker: document.getElementById("newColorHexPicker"),

  brandGuidelines: document.getElementById("brandGuidelines"),
  labelDescription: document.getElementById("labelDescription"),
  visualAnalysisOutput: document.getElementById("visualAnalysisOutput"),

  designSystemPdf: document.getElementById("designSystemPdf"),
  designSystemPreview: document.getElementById("designSystemPreview"),
  fewShotImages: document.getElementById("fewShotImages"),
  fewShotPreview: document.getElementById("fewShotPreview"),
  correctLabelImages: document.getElementById("correctLabelImages"),
  correctLabelPreview: document.getElementById("correctLabelPreview"),
  incorrectLabelImages: document.getElementById("incorrectLabelImages"),
  incorrectLabelPreview: document.getElementById("incorrectLabelPreview"),

  assetImages: document.getElementById("assetImages"),
  assetPreview: document.getElementById("assetPreview"),
  reviewQuery: document.getElementById("reviewQuery"),

  btnDestill: document.getElementById("btnDestill"),
  btnReview: document.getElementById("btnReview"),
  reviewIcon: document.getElementById("reviewIcon"),
  reviewText: document.getElementById("reviewText"),
  loading: document.getElementById("loading"),
  errorMessage: document.getElementById("errorMessage"),
  resultContainer: document.getElementById("resultContainer")
};

export const severityColors = {
  "CRITICAL": "bg-red-600 text-white",
  "HIGH": "bg-red-400 text-white",
  "MEDIUM": "bg-yellow-400 text-gray-900",
  "LOW": "bg-yellow-200 text-gray-900",
  "CUMPLIMIENTO": "bg-green-100 text-green-700"
};

export function setStatus(el, kind, text) {
  const base = "mt-2 p-3 text-sm rounded-lg shadow-inner";
  const map = {
    info: "bg-blue-100 text-blue-800",
    ok: "bg-green-100 text-green-800",
    warn: "bg-yellow-100 text-yellow-800",
    err: "bg-red-100 text-red-800"
  };
  el.className = `${base} ${map[kind]}`;
  el.textContent = text;
  el.classList.remove("hidden");
}

export function hide(el) {
  el.classList.add("hidden");
}

export function show(el) {
  el.classList.remove("hidden");
}

export function renderColorList() {
  els.colorList.innerHTML = state.brandColors.map(c => `
    <div class="flex items-center justify-between p-2 bg-white rounded-lg border">
      <div class="flex items-center gap-3">
        <div class="color-display" style="background:${c.hex};"></div>
        <span class="font-semibold">${c.name}:</span>
        <span class="font-mono text-sm text-indigo-700">${c.hex}</span>
      </div>
      <button data-hex="${c.hex}" class="btn-remove-color text-red-600 hover:text-red-800">✕</button>
    </div>
  `).join("");
  // wire remove buttons
  els.colorList.querySelectorAll(".btn-remove-color").forEach(btn => {
    btn.addEventListener("click", () => {
      const hex = btn.getAttribute("data-hex");
      const idx = state.brandColors.findIndex(x => x.hex === hex);
      if (idx > -1) {
        state.brandColors.splice(idx, 1);
        renderColorList();
      }
    });
  });
}

export function renderThumb(container, file, kind) {
  const el = document.createElement(kind === "pdf" ? "div" : "img");
  if (kind === "pdf") {
    el.className = "image-preview-item flex items-center justify-center bg-indigo-50 text-indigo-700 p-2 text-xs font-semibold";
    el.textContent = "PDF";
  } else {
    el.className = "image-preview-item";
    el.src = `data:${file.mimeType};base64,${file.data}`;
  }
  container.appendChild(el);
}

export function renderAuditCard(payload) {
  const parsed = payload;
  let verdictColor =
    parsed.overall_verdict === "APROBADO" ? "bg-green-600 text-white"
      : parsed.overall_verdict === "RECHAZADO" ? "bg-red-700 text-white"
      : "bg-yellow-500 text-gray-900";

  let html = `
  <div class="p-4 mb-6 rounded-xl font-extrabold text-2xl flex justify-between items-center ${verdictColor}">
    <span>VEREDICTO: ${parsed.overall_verdict}</span>
    <span class="text-3xl">Score: ${parsed.overall_score}/100</span>
  </div>
  `;

  const cumpl = (parsed.review_details || []).filter(d => d.finding_type === "CUMPLIMIENTO");
  const infr = (parsed.review_details || []).filter(d => d.finding_type === "INFRACCION");

  if (cumpl.length) {
    html += `<h3 class="text-xl font-bold text-green-700 mb-3 border-b pb-1 border-green-200">Puntos de Cumplimiento (✓)</h3><ul class="space-y-3 mb-6">`;
    cumpl.forEach(d => {
      html += `
      <li class="flex items-start text-green-700 bg-green-50 p-3 rounded-lg shadow-sm">
        <span class="mr-3">✅</span>
        <div class="flex-grow">
          <span class="font-bold mr-2">[${d.module}]</span>${d.description}
        </div>
      </li>`;
    });
    html += `</ul>`;
  }

  if (infr.length) {
    html += `<h3 class="text-xl font-bold text-red-700 mb-3 border-b pb-1 border-red-200">INFRACCIONES (✕)</h3><ul class="space-y-4">`;
    infr.sort((a,b) => {
      const order = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, "N/A": 0 };
      return order[b.severity] - order[a.severity];
    });
    infr.forEach(d => {
      const sevColor = severityColors[d.severity] || "bg-gray-200 text-gray-800";
      html += `
      <li class="p-4 rounded-lg border-l-4 border-red-500 shadow bg-white">
        <div class="flex items-center mb-2">
          <span class="px-2 py-1 text-xs font-bold rounded-full ${sevColor} mr-3">${d.severity}</span>
          <span class="font-bold text-gray-800 mr-2">[${d.module}]</span>
          <span class="text-sm text-gray-700">${d.description}</span>
        </div>
        <div class="text-indigo-700 font-semibold border-t border-dashed pt-2 mt-2">
          ACCIÓN: ${d.feedback}
        </div>
      </li>`;
    });
    html += `</ul>`;
  }

  return html;
}

