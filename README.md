# R-Markdown 编辑器

> 专为微信公众号打造的 Markdown 排版工具，所见即所得，一键复制到公众号后台。

## ✨ 功能特性

- **实时预览** — 左侧编辑 Markdown，右侧实时渲染公众号效果
- **一键复制** — 富文本 / HTML 源码两种复制模式，直接粘贴到公众号编辑器
- **保存图片** — 将排版内容导出为高清 PNG 图片
- **主题切换** — 15 款预设主题色 + 自定义颜色，支持暗色模式
- **滚动同步** — 编辑器与预览面板滚动位置按比例联动
- **自动保存** — 内容实时保存到 localStorage，刷新不丢失
- **可调面板** — 拖拽调整编辑器与预览区宽度

## 🎨 排版能力

基于 [awesome-design-md](https://www.npmjs.com/package/awesome-design-md) 排版引擎，支持丰富的公众号扩展语法：

| 语法               | 效果                  |
| ------------------ | --------------------- |
| `==渐变背景文字==` | 渐变背景强调          |
| `::柔光重点文字::` | 柔光蓝紫色文字        |
| `!!胶囊文字!!`     | 超圆角胶囊背景        |
| `^^加重强调^^`     | 靛青加重文字          |
| `<breaking>`       | 突发/重大更新卡片     |
| `<compare>`        | Before/After 对比布局 |
| `<cta>`            | 行动召唤卡片          |
| `::: steps`        | 横向步骤流            |
| `> [TIP]`          | 提示框                |

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- pnpm

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/RobocopMao/r-markdown.git
cd r-markdown

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

浏览器打开终端输出的地址即可使用。

### 构建生产版本

```bash
pnpm build
```

构建产物输出到 `dist/` 目录。

### 预览构建结果

```bash
pnpm preview
```

## 📦 技术栈

- **Vue 3** (Composition API + `<script setup>`)
- **TypeScript**
- **Vite** — 构建工具
- **CodeMirror 6** — Markdown 编辑器内核
- **Tailwind CSS 4** — 样式系统
- **html-to-image** — 图片导出

## 📁 项目结构

```
r-markdown/
├── src/
│   ├── components/
│   │   ├── Editor.vue        # CodeMirror 编辑器
│   │   ├── Preview.vue       # 公众号预览面板
│   │   ├── ThemePicker.vue   # 主题色选择器
│   │   └── DarkModeToggle.vue # 暗色模式切换
│   ├── composables/
│   │   ├── useTheme.ts       # 主题管理（颜色、CSS 变量）
│   │   └── useDarkMode.ts    # 暗色模式状态
│   ├── utils/
│   │   └── markdownParser.ts # Markdown → HTML 解析
│   ├── styles/
│   │   └── ...               # 全局样式
│   ├── App.vue               # 主布局（工具栏 + 双栏编辑）
│   └── main.ts               # 入口
├── .github/workflows/
│   └── deploy.yml            # GitHub Actions 自动部署
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 🌐 在线体验

访问 [GitHub Pages](https://robocopmao.github.io/r-markdown/) 直接使用。

## 📄 License

MIT
