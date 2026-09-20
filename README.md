# EasyKiConverter Website

[English](README_en.md)

EasyKiConverter 官方网站，使用原生 HTML、CSS 与 JavaScript 构建。

## 项目结构

```text
.
├── index.html              # 网站入口，适配 GitHub Pages 与本地预览
├── src/
│   ├── css/                # 页面样式与彩蛋样式
│   └── js/                 # 页面交互逻辑
├── assets/                 # 图片、字体等静态资源
├── docs/                   # 项目维护文档
└── .github/workflows/      # GitHub Actions 工作流
```

新增页面入口仍放在根目录或明确的页面目录中；样式放入 `src/css/`，脚本放入 `src/js/`，图片和字体放入 `assets/`，不要把源码或资源继续堆在根目录。

详细架构约束见：[项目架构](docs/ARCHITECTURE.md) | [开发者文档](docs/developer/README.md)。

## 本地预览

```bash
python3 -m http.server 4173
```

然后打开 <http://localhost:4173>。

## 设计方向

页面采用温暖的纸张底色、抽象流体图形和弹性缓动动画，强调像 Qt 软件一样顺滑的操作反馈，同时保留轻量、易维护的静态站点结构。

## 品牌资源

官网复用了 EasyKiConverter 主项目中的官方应用图标，来源为主项目的 `resources/icons/app_icon.svg` 与 `app_icon_dark.svg`，当前副本位于 `assets/icons/`。

## 分支开发流程

- `master`：稳定生产分支，只接收已经验证稳定的版本分支。
- `version/V0.0.1`：当前版本分支，功能完成并通过测试后合并到这里。
- `feature/<功能名称>`：新功能开发分支，从当前版本分支创建；开发完成后先测试，再合并回版本分支。

示例：

```bash
git switch version/V0.0.1
git switch -c feature/improve-download-section
# 开发并测试完成后，将 feature 分支合并回 version/V0.0.1
```

版本分支稳定后，才允许合并到 `master`。
