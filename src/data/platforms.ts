import { latestRelease } from "./release";

export type PlatformLanguage = "zh" | "en";

export type PlatformAvailability = {
  name: string;
  labels: string[];
  assetCount: number;
};

const localizeAssetLabel = (label: string) => label
  .replace(" installer", " 安装包")
  .replace("Apple Silicon", "Apple 芯片");

export const getPlatformAvailability = (language: PlatformLanguage): PlatformAvailability[] => {
  const localize = language === "zh" ? localizeAssetLabel : (label: string) => label;

  return [
    {
      name: "Windows",
      assetCount: latestRelease.assets.windows.length,
      labels: latestRelease.assets.windows.map((asset) => localize(asset.label)),
    },
    {
      name: "Linux",
      assetCount: latestRelease.assets.linux.length,
      labels: latestRelease.assets.linux.map((asset) => localize(asset.label)),
    },
    {
      name: "macOS",
      assetCount: latestRelease.assets.macos.length,
      labels: latestRelease.assets.macos.map((asset) => localize(asset.label)),
    },
  ];
};
