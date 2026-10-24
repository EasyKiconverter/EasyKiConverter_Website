import sizes from "./lab-model-sizes.json";

const toMegabytes = (bytes: number) => (bytes / 1_000_000).toFixed(2);

export const labModelSizes = {
  desktop: toMegabytes(sizes.desktop),
  mobile: toMegabytes(sizes.mobile),
} as const;
