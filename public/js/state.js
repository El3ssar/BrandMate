export const state = {
  provider: "gemini",
  brandColors: [],
  designSystemFiles: [],
  fewShotImages: [],
  correctLabelImages: [],
  incorrectLabelImages: [],
  reviewAssets: []
};

export function resetArrays() {
  state.designSystemFiles.length = 0;
  state.fewShotImages.length = 0;
  state.correctLabelImages.length = 0;
  state.incorrectLabelImages.length = 0;
  state.reviewAssets.length = 0;
}

