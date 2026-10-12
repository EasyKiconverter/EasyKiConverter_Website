export type CaseStudy = {
  id: string;
  titleZh: string;
  titleEn: string;
  summaryZh: string;
  summaryEn: string;
  inputZh: string;
  inputEn: string;
  outputZh: string;
  outputEn: string;
  fixture: string;
  test: string;
};

// Evidence paths are kept in the main repository so claims can be audited against source and tests.
export const caseStudies: CaseStudy[] = [
  {
    id: "easyeda-kicad",
    titleZh: "EasyEDA 元件 → KiCad 库",
    titleEn: "EasyEDA component → KiCad library",
    summaryZh: "使用基础符号、封装和 CAD 测试样本，验证导入到 KiCad 符号与封装输出的离线路径。",
    summaryEn: "Uses symbol, footprint and CAD fixtures to verify the offline import-to-KiCad symbol and footprint path.",
    inputZh: "EasyEDA 元件",
    inputEn: "EasyEDA component",
    outputZh: "KiCad 库",
    outputEn: "KiCad library",
    fixture: "tests/fixtures/easyeda/symbol_basic.json",
    test: "tests/integration/test_fixture_to_kicad_export.cpp",
  },
  {
    id: "easyeda-altium",
    titleZh: "EasyEDA 元件 → Altium 库",
    titleEn: "EasyEDA component → Altium libraries",
    summaryZh: "通过集成测试验证 SchLib、PcbLib 与三维模型输出；是否可被特定桌面版本打开仍需人工验收。",
    summaryEn: "The integration test covers SchLib, PcbLib and 3D output; opening the result in a specific desktop version still requires manual acceptance.",
    inputZh: "EasyEDA 元件",
    inputEn: "EasyEDA component",
    outputZh: "Altium 库",
    outputEn: "Altium libraries",
    fixture: "tests/fixtures/easyeda/footprint_basic.json",
    test: "tests/integration/test_parallel_export_cancellation.cpp",
  },
  {
    id: "bom-batch",
    titleZh: "BOM 批量转换 → 多目标输出",
    titleEn: "BOM batch conversion → multiple targets",
    summaryZh: "以混合 BOM 测试样本驱动批量导出和诊断，展示 GUI/CLI 之外可重复的输入证据。",
    summaryEn: "Uses the mixed BOM fixture to drive batch export and diagnostics, making the input evidence reproducible beyond the GUI/CLI.",
    inputZh: "混合 BOM",
    inputEn: "Mixed BOM",
    outputZh: "多目标输出",
    outputEn: "Multiple targets",
    fixture: "tests/fixtures/bom/mixed_components.csv",
    test: "tests/integration/test_parallel_export_cancellation.cpp",
  },
];
