export type FormatRecord = {
  id: string;
  name: string;
  tier: "primary" | "registered";
  zh: string;
  en: string;
};

// The names mirror TargetEdaFormat in the main EasyKiConverter repository.
export const targetFormats: FormatRecord[] = [
  { id: "KiCad", name: "KiCad", tier: "primary", zh: "稳定版主要目标", en: "Primary stable target" },
  { id: "Altium", name: "Altium Designer", tier: "primary", zh: "稳定版主要目标", en: "Primary stable target" },
  { id: "Xpedition", name: "Xpedition", tier: "registered", zh: "已注册导出目标，按发布版本验证", en: "Registered target; verify per Release" },
  { id: "Allegro", name: "Allegro", tier: "registered", zh: "已注册导出目标，按发布版本验证", en: "Registered target; verify per Release" },
  { id: "PADS", name: "PADS", tier: "registered", zh: "已注册导出目标，按发布版本验证", en: "Registered target; verify per Release" },
  { id: "Eagle", name: "Eagle", tier: "registered", zh: "已注册导出目标，按发布版本验证", en: "Registered target; verify per Release" },
  { id: "P-CAD", name: "P-CAD", tier: "registered", zh: "已注册导出目标，按发布版本验证", en: "Registered target; verify per Release" },
  { id: "CADSTAR", name: "CADSTAR", tier: "registered", zh: "已注册导出目标，按发布版本验证", en: "Registered target; verify per Release" },
  { id: "OrCAD", name: "OrCAD Capture", tier: "registered", zh: "已注册导出目标，按发布版本验证", en: "Registered target; verify per Release" },
  { id: "LibrePCB", name: "LibrePCB", tier: "registered", zh: "已注册导出目标，按发布版本验证", en: "Registered target; verify per Release" },
  { id: "Horizon", name: "Horizon EDA", tier: "registered", zh: "已注册导出目标，按发布版本验证", en: "Registered target; verify per Release" },
];
