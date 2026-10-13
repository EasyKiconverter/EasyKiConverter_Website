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
  fixtures: string[];
  inputEvidenceZh: string;
  inputEvidenceEn: string;
  test: string;
};

// Evidence paths are kept in the main repository so claims can be audited against source and tests.
export const caseStudies: CaseStudy[] = [
  {
    id: "easyeda-kicad",
    titleZh: "EasyEDA 样本 → KiCad 库",
    titleEn: "EasyEDA fixtures → KiCad libraries",
    summaryZh: "集成测试直接读取符号与封装样本，并验证 KiCad 符号库和封装文件均已生成。",
    summaryEn: "The integration test reads symbol and footprint fixtures, then verifies that both the KiCad symbol library and footprint file are generated.",
    inputZh: "符号与封装样本",
    inputEn: "Symbol and footprint fixtures",
    outputZh: "KiCad 符号库 + 封装",
    outputEn: "KiCad symbol library + footprint",
    fixtures: [
      "tests/fixtures/easyeda/symbol_basic.json",
      "tests/fixtures/easyeda/footprint_basic.json",
    ],
    inputEvidenceZh: "这两个 EasyEDA JSON 样本由该测试直接读取。",
    inputEvidenceEn: "Both EasyEDA JSON fixtures are read directly by this test.",
    test: "tests/integration/test_fixture_to_kicad_export.cpp",
  },
  {
    id: "altium-pipeline",
    titleZh: "Altium 库导出管线",
    titleEn: "Altium library export pipeline",
    summaryZh: "集成测试在本地构造确定性元件数据，验证 SchLib、PcbLib 与嵌入式 STEP 模型；它不代表 EasyEDA 在线导入或桌面 Altium 人工验收。",
    summaryEn: "The integration test builds deterministic component data locally and verifies SchLib, PcbLib, and an embedded STEP model. It does not represent an EasyEDA online import or manual validation in Altium Desktop.",
    inputZh: "测试内生成的元件数据",
    inputEn: "Test-generated component data",
    outputZh: "SchLib + PcbLib + STEP",
    outputEn: "SchLib + PcbLib + STEP",
    fixtures: [],
    inputEvidenceZh: "输入由集成测试代码生成，不对应独立的 EasyEDA 样本文件。",
    inputEvidenceEn: "The integration test generates its input; there is no separate EasyEDA fixture file for this case.",
    test: "tests/integration/test_parallel_export_cancellation.cpp",
  },
];
