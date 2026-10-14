export type FormatRecord = {
  id: string;
  name: string;
  tier: "primary" | "registered";
  zh: string;
  en: string;
  shortZh: string;
  shortEn: string;
  testedArtifactsZh: string;
  testedArtifactsEn: string;
  evidenceFile: string;
};

// The target list mirrors the main repository; artifact notes summarize linked evidence, not full format support.
export const targetFormats: FormatRecord[] = [
  {
    id: "KiCad", name: "KiCad", tier: "primary", zh: "稳定版主要目标", en: "Primary stable target", shortZh: "稳定版目标", shortEn: "Stable target",
    testedArtifactsZh: "符号库 .kicad_sym、封装库 .pretty/.kicad_mod、独立 WRL 模型。",
    testedArtifactsEn: "Symbol library .kicad_sym, footprint library .pretty/.kicad_mod, and a separate WRL model.",
    evidenceFile: "tests/unit/test_kicad_exporter_golden.cpp",
  },
  {
    id: "Altium", name: "Altium Designer", tier: "primary", zh: "稳定版主要目标", en: "Primary stable target", shortZh: "稳定版目标", shortEn: "Stable target",
    testedArtifactsZh: "SchLib + PcbLib；人工验证规程检查封装库中的 STEP 模型嵌入。",
    testedArtifactsEn: "SchLib + PcbLib; the manual procedure checks embedded STEP models in the footprint library.",
    evidenceFile: "tests/manual/ALTIUM_EXPORT_MANUAL_TEST.md",
  },
  {
    id: "Xpedition", name: "Xpedition", tier: "registered", zh: "已注册导出目标，按发布版本验证", en: "Registered target; verify per Release", shortZh: "按发布验证", shortEn: "Verify per Release",
    testedArtifactsZh: "符号与封装 ZIP 包、独立 WRL 模型目录。",
    testedArtifactsEn: "Symbol and footprint ZIP packages, plus a separate WRL model directory.",
    evidenceFile: "tests/unit/test_xpedition_exporter.cpp",
  },
  {
    id: "Allegro", name: "Allegro", tier: "registered", zh: "已注册导出目标，按发布版本验证", en: "Registered target; verify per Release", shortZh: "按发布验证", shortEn: "Verify per Release",
    testedArtifactsZh: "Import Package：符号 JSON、封装数据与 STEP 模型文件。",
    testedArtifactsEn: "Import Package with symbol JSON, footprint data, and a STEP model file.",
    evidenceFile: "tests/unit/test_allegro_exporter.cpp",
  },
  {
    id: "PADS", name: "PADS", tier: "registered", zh: "已注册导出目标，按发布版本验证", en: "Registered target; verify per Release", shortZh: "按发布验证", shortEn: "Verify per Release",
    testedArtifactsZh: ".c 符号、.p Part Type、.d 封装与独立 WRL 模型。",
    testedArtifactsEn: ".c symbol, .p Part Type, .d footprint, and a separate WRL model.",
    evidenceFile: "tests/unit/test_pads_exporter.cpp",
  },
  {
    id: "Eagle", name: "Eagle", tier: "registered", zh: "已注册导出目标，按发布版本验证", en: "Registered target; verify per Release", shortZh: "按发布验证", shortEn: "Verify per Release",
    testedArtifactsZh: "组合 .lbr 库与独立 WRL 模型。",
    testedArtifactsEn: "Combined .lbr library and a separate WRL model.",
    evidenceFile: "tests/unit/test_eagle_exporter.cpp",
  },
  {
    id: "P-CAD", name: "P-CAD", tier: "registered", zh: "已注册导出目标，按发布版本验证", en: "Registered target; verify per Release", shortZh: "按发布验证", shortEn: "Verify per Release",
    testedArtifactsZh: "Sch 与 PCB .lia 库文件、独立 WRL 模型。",
    testedArtifactsEn: "Sch and PCB .lia library files, plus a separate WRL model.",
    evidenceFile: "tests/unit/test_pcad_exporter.cpp",
  },
  {
    id: "CADSTAR", name: "CADSTAR", tier: "registered", zh: "已注册导出目标，按发布版本验证", en: "Registered target; verify per Release", shortZh: "按发布验证", shortEn: "Verify per Release",
    testedArtifactsZh: "包含符号与封装数据的组合 .lib、独立 WRL 模型。",
    testedArtifactsEn: "Combined .lib with symbol and footprint data, plus a separate WRL model.",
    evidenceFile: "tests/unit/test_cadstar_exporter.cpp",
  },
  {
    id: "OrCAD", name: "OrCAD Capture", tier: "registered", zh: "已注册导出目标，按发布版本验证", en: "Registered target; verify per Release", shortZh: "按发布验证", shortEn: "Verify per Release",
    testedArtifactsZh: "XML 符号库与独立 WRL 模型；该测试路径不包含封装导出阶段。",
    testedArtifactsEn: "XML symbol library and a separate WRL model; this tested path has no footprint-export stage.",
    evidenceFile: "tests/unit/test_orcad_exporter.cpp",
  },
  {
    id: "LibrePCB", name: "LibrePCB", tier: "registered", zh: "已注册导出目标，按发布版本验证", en: "Registered target; verify per Release", shortZh: "按发布验证", shortEn: "Verify per Release",
    testedArtifactsZh: ".lplib 库中的符号、封装、元件、器件文件，并检查封装中的 3D 模型关联。",
    testedArtifactsEn: "Symbol, package, component, and device files in a .lplib library; the test also checks its 3D-model reference.",
    evidenceFile: "tests/unit/test_librepcb_exporter.cpp",
  },
  {
    id: "Horizon", name: "Horizon EDA", tier: "registered", zh: "已注册导出目标，按发布版本验证", en: "Registered target; verify per Release", shortZh: "按发布验证", shortEn: "Verify per Release",
    testedArtifactsZh: ".pool 符号数据（unit、symbol、entity）；当前集成用例只覆盖符号导出路径。",
    testedArtifactsEn: ".pool symbol data (unit, symbol, and entity); the current integration case covers the symbol-only path.",
    evidenceFile: "tests/unit/test_horizon_exporter.cpp",
  },
];
