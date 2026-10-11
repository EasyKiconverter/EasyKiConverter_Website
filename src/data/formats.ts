export type FormatRecord = {
  id: string;
  name: string;
  zh: string;
  en: string;
};

// The names mirror TargetEdaFormat in the main EasyKiConverter repository.
export const targetFormats: FormatRecord[] = [
  { id: "KiCad", name: "KiCad", zh: "稳定版主要目标", en: "Primary stable target" },
  { id: "Altium", name: "Altium Designer", zh: "稳定版主要目标", en: "Primary stable target" },
  { id: "Xpedition", name: "Xpedition", zh: "已注册导出目标，按 Release 验证", en: "Registered target; verify per Release" },
  { id: "Allegro", name: "Allegro", zh: "已注册导出目标，按 Release 验证", en: "Registered target; verify per Release" },
  { id: "PADS", name: "PADS", zh: "已注册导出目标，按 Release 验证", en: "Registered target; verify per Release" },
  { id: "Eagle", name: "Eagle", zh: "已注册导出目标，按 Release 验证", en: "Registered target; verify per Release" },
  { id: "P-CAD", name: "P-CAD", zh: "已注册导出目标，按 Release 验证", en: "Registered target; verify per Release" },
  { id: "CADSTAR", name: "CADSTAR", zh: "已注册导出目标，按 Release 验证", en: "Registered target; verify per Release" },
  { id: "OrCAD", name: "OrCAD Capture", zh: "已注册导出目标，按 Release 验证", en: "Registered target; verify per Release" },
  { id: "LibrePCB", name: "LibrePCB", zh: "已注册导出目标，按 Release 验证", en: "Registered target; verify per Release" },
  { id: "Horizon", name: "Horizon EDA", zh: "已注册导出目标，按 Release 验证", en: "Registered target; verify per Release" },
];
