# EasyKiConverter Website

EasyKiConverter 官方网站，使用原生 HTML、CSS 与 JavaScript 构建。

## 本地预览

```bash
python3 -m http.server 4173
```

然后打开 <http://localhost:4173>。

## 设计方向

页面采用温暖的纸张底色、抽象流体图形和弹性缓动动画，强调像 Qt 软件一样顺滑的操作反馈，同时保留轻量、易维护的静态站点结构。

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
