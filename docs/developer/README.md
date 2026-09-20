# 开发者文档

[English](README_en.md)

本目录是 EasyKiConverter Website 的开发约束入口。所有参与开发的人员和自动化代理都应先阅读相关规范，再开始修改代码。

## 规范索引

- [项目开发规范](DEVELOPMENT_GUIDELINES.md) / [English](DEVELOPMENT_GUIDELINES_en.md)：代码、目录、兼容性和资源约束。
- [开发流程规范](DEVELOPMENT_WORKFLOW.md) / [English](DEVELOPMENT_WORKFLOW_en.md)：Issue、分支、测试、版本和合并流程。

## 必须遵守的原则

1. 新功能从 `feature/<name>` 分支开始，禁止直接在 `master` 或版本分支开发。
2. 功能必须在本地验证通过后，才能合并到 `version/V0.0.1`。
3. 版本分支稳定后，才能合并到 `master`。
4. 文档必须同时维护中文和英文版本，并添加互相跳转链接。
5. 文件必须放入明确负责的目录，禁止为了方便把源码、资源或文档堆在根目录。
