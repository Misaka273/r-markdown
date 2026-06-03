# r-markdown 开发规范

> 每次开发前必须阅读本文档，确保代码风格和项目结构一致。

## 项目概述

公众号 Markdown 排版编辑器，支持实时预览、主题切换、深色模式、多种排版风格（Indigo V2 / 咸鱼幽默 / 技术圈 / 诗意散文）。

## 技术栈

| 类别   | 技术                    | 版本  |
| ------ | ----------------------- | ----- |
| 框架   | Vue 3 (Composition API) | 3.6.x |
| 语言   | TypeScript              | 6.x   |
| 构建   | Vite                    | 5.x   |
| 样式   | Tailwind CSS 4          | 4.2.x |
| 编辑器 | CodeMirror 6            | 6.x   |
| 路由   | Vue Router              | 4.6.x |
| 包管理 | pnpm                    | -     |
| Node   | >= 20.0.0               | -     |

## 目录结构

```
src/
├── components/          # 可复用组件
│   ├── DarkModeToggle.vue   # 深色模式切换
│   ├── Editor.vue           # CodeMirror 编辑器
│   ├── Preview.vue          # Markdown 预览
│   └── ThemePicker.vue      # 主题选择器
├── editor-components/   # 排版组件库
│   ├── index.ts             # 组件注册与导出
│   ├── Badges_DA01.ts       # 标签徽章
│   ├── Breaking_DA01.ts     # 突发新闻卡片
│   ├── CaseFlow_DA01.ts     # 案例流程
│   ├── Compare_DA01.ts      # 对比布局 v1
│   ├── Compare_DA02.ts      # 对比布局 v2
│   ├── Cta_DA01.ts          # 行动召唤
│   ├── Engage_DA01.ts       # 互动引导 v1
│   ├── Engage_DA02.ts       # 互动引导 v2
│   ├── Lead_DA01.ts         # 引导文段
│   ├── PTitle_DA01.ts       # 副标题
│   ├── ReadingPath_DA01.ts  # 阅读路径
│   ├── Slider_DA01.ts       # 图片幻灯片轮播
│   ├── Statement_DA01.ts    # 居中强调语
│   ├── Steps_DA01.ts        # 步骤流 v1
│   ├── Steps_DA02.ts        # 步骤流 v2
│   ├── Timeline_DA01.ts     # 时间线
│   ├── Title_DA01.ts        # 标题 v1
│   └── Title_DA02.ts        # 标题 v2
├── composables/         # Vue 组合式函数
│   ├── useDarkMode.ts       # 深色模式逻辑
│   └── useTheme.ts          # 主题管理
├── router/              # 路由配置
│   └── index.ts
├── styles/              # 全局样式
│   └── style.css
├── utils/               # 工具函数
│   ├── components.ts        # 组件解析器（callout/timeline 等）
│   ├── helpers.ts           # 通用工具（esc/leaf/lightenHex 等）
│   └── inlineFormat.ts      # 行内格式化（==渐变::柔光!!胶囊^^上标等）
├── views/               # 页面级组件
│   ├── EditorPage.vue       # 编辑器页面
│   └── LandingPage.vue      # 首页
├── App.vue              # 根组件
└── main.ts              # 入口文件
```

## 开发环境搭建

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 代码检查
pnpm check        # ESLint + Prettier 检查
pnpm lint         # ESLint 自动修复
pnpm format       # Prettier 格式化
```

## 代码规范

### ESLint 规则

- `prefer-const`: 强制使用 const
- `no-var`: 禁止 var
- `no-console`: 仅允许 console.warn 和 console.error
- `@typescript-eslint/no-explicit-any`: 警告（尽量避免 any）
- `@typescript-eslint/no-unused-vars`: 警告（`_` 开头的变量/参数忽略）
- `vue/multi-word-component-names`: 关闭
- `vue/no-v-html`: 关闭（项目需要 v-html 渲染 Markdown）

### Prettier 规则

```json
{
  "semi": false, // 不加分号
  "singleQuote": true, // 单引号
  "tabWidth": 2, // 2 空格缩进
  "trailingComma": "all", // 尾逗号
  "printWidth": 100, // 行宽 100
  "bracketSpacing": true, // 括号空格
  "arrowParens": "always", // 箭头函数参数加括号
  "endOfLine": "lf" // LF 换行
}
```

## 命名规范

### 文件命名

| 类型       | 格式                  | 示例                 |
| ---------- | --------------------- | -------------------- |
| Vue 组件   | PascalCase            | `DarkModeToggle.vue` |
| 组合式函数 | camelCase（use 前缀） | `useTheme.ts`        |
| 工具函数   | camelCase             | `inlineFormat.ts`    |
| 路由       | camelCase             | `index.ts`           |
| 样式       | kebab-case            | `style.css`          |

### 代码命名

| 类型      | 格式                   | 示例                           |
| --------- | ---------------------- | ------------------------------ |
| 变量/函数 | camelCase              | `formatText`, `isDark`         |
| 类型/接口 | PascalCase             | `ThemeColors`, `CalloutConfig` |
| 常量      | UPPER_SNAKE_CASE       | `DEFAULT_THEME`                |
| CSS 类名  | kebab-case（Tailwind） | `bg-white`, `text-gray-500`    |
| 私有属性  | `_` 前缀               | `_m`, `_p1`（正则回调参数）    |

## Vue 组件规范

### 基本结构

```vue
<script setup lang="ts">
// 1. 导入
import { ref, computed, watch, onMounted } from 'vue'
import SomeComponent from './SomeComponent.vue'

// 2. Props 定义
const props = defineProps<{ title: string }>()

// 3. Emits 定义
const emit = defineEmits<{ change: [value: string] }>()

// 4. 响应式状态
const count = ref(0)

// 5. 计算属性
const doubled = computed(() => count.value * 2)

// 6. 方法
function increment() {
  count.value++
}

// 7. 生命周期
onMounted(() => {
  // 初始化
})
</script>

<template>
  <div>{{ title }}: {{ doubled }}</div>
</template>
```

### 关键规则

- **始终使用 `<script setup>`**，不要用 Options API
- **Props 用类型声明**：`defineProps<{ ... }>()`
- **Emits 用类型声明**：`defineEmits<{ ... }>()`
- **组件引入后直接使用**，无需注册
- **模板中使用 kebab-case 组件名**：`<dark-mode-toggle />`

## TypeScript 规范

- **严格模式**已开启（`strict: true`）
- **避免 `any`**，用 `unknown` 或具体类型替代
- **正则回调参数**用 `_m`, `_p1`, `_p2` 命名（匹配但不使用）
- **工具函数导出**用 `export function`，不用 `export default`
- **类型定义**集中在文件顶部或独立类型文件中

## 样式规范

### Tailwind CSS 4

- 优先使用 Tailwind 工具类，避免自定义 CSS
- 自定义样式写在 `<style scoped>` 中
- 全局样式写在 `src/styles/style.css`

### 主题色系统

主题色通过 `useTheme()` composable 获取，包含以下属性：

```typescript
interface ThemeColors {
  accent: string // 主题强调色（如 #6366f1）
  dark: string // 深色变体
  light: string // 浅色变体
  rgb: string // RGB 值（如 "99,102,241"）
  border: string // 边框色
}
```

### 行内格式化语法

在 `src/utils/inlineFormat.ts` 中定义：

| 语法         | 效果     | HTML 输出                                          |
| ------------ | -------- | -------------------------------------------------- |
| `==文字==`   | 渐变背景 | `<span style="background:linear-gradient(...)">`   |
| `::文字::`   | 柔光重点 | `<span style="color:...;font-weight:700">`         |
| `!!文字!!`   | 胶囊文字 | `<span style="background:...;border-radius:20px">` |
| `^^文字^^`   | 上标强调 | `<strong style="color:...">`                       |
| `__文字__`   | 下划线   | `<span style="text-decoration:underline">`         |
| `~~文字~~`   | 删除线   | `<del>`                                            |
| `**文字**`   | 加粗     | `<strong>`                                         |
| `*文字*`     | 斜体     | `<em>`                                             |
| `` `文字` `` | 行内代码 | `<code>`                                           |
| `[text](url "desc")` | 脚注引用 | 带引号标题的链接自动转为脚注，文末生成参考资料 |

### 组件解析语法

### 编辑器组件语法

在 `src/editor-components/` 目录下定义，通过 `<tag>` 标签使用：

| 标签           | 组件           | 说明                     |
| -------------- | -------------- | ------------------------ |
| `<title>`      | 标题组件       | 支持 v1/v2 两种样式      |
| `<ptitle>`     | 副标题组件     | 支持 hide 属性隐藏元素   |
| `<statement>`  | 居中强调语     | -                        |
| `<lead>`       | 引导文字段     | -                        |
| `<breaking>`   | 突发新闻卡片   | -                        |
| `<compare>`    | 对比布局       | 支持 v1/v2 两种样式      |
| `<cta>`        | 行动召唤卡片   | -                        |
| `<steps>`      | 横向步骤流     | 支持 v1/v2 两种样式      |
| `<timeline>`   | 时间线组件     | -                        |
| `<engage>`     | 互动引导组件   | 支持 v1/v2 两种样式      |
| `<caseflow>`   | 案例流程组件   | -                        |
| `<readingpath>`| 阅读路径组件   | -                        |
| `<slider>`     | 图片幻灯片轮播 | 支持 4 种轮播模式        |
| `<badges>`     | 标签徽章       | -                        |

## Git 工作流

### 分支策略

- `main`: 生产分支，只接受合并，不直接提交
- `develop`: 开发分支，日常开发在此分支
- 功能分支从 `develop` 创建，完成后合并回 `develop`

### 提交规范

```
<type>: <subject>

type 类型：
  feat     新功能
  fix      修复
  style    样式调整（不影响逻辑）
  refactor 重构
  docs     文档
  chore    构建/工具变更
```

示例：

```
feat: 添加时间线组件
fix: 修复渐变背景文字颜色不显示
style: 调整深色模式下卡片边框颜色
```

### Tag 规范

格式：`v{major}.{minor}.{patch}-{date}`

示例：`v0.1.3-20260518`

### ⚠️ 推送规则（强制）

**只有用户主动提出推送代码时，才执行 `git push`。** 无论哪个分支（main / develop / 功能分支），AI 不得自行决定推送。

- 提交（commit）可以在开发过程中自动执行
- 推送（push）必须等用户明确说"推送"、"push"、"推到线上"等指令后才执行
- 合并（merge）到 main 分支也需要用户确认后才执行
- 删除远程 tag 同理，需用户确认

### 发布流程

```bash
# 1. 在 develop 分支开发并提交
git add .
git commit -m "feat: xxx"

# 2. 用户确认后合并到 main
git checkout main
git merge develop

# 3. 用户确认后推送 main
git push origin main

# 4. 用户确认后删除旧 tag 并重新打 tag
git tag -d v0.1.x-xxxxxx
git push origin :refs/tags/v0.1.x-xxxxxx
git tag v0.1.x-xxxxxx
git push origin v0.1.x-xxxxxx

# 5. 用户确认后推送 develop
git checkout develop
git push origin develop
```

## 构建与部署

### 本地构建

```bash
pnpm build
```

构建产物在 `dist/` 目录。

### GitHub Pages 部署

项目配置了 GitHub Actions 自动部署，推送 `main` 分支后自动构建并发布到 GitHub Pages。

- 基础路径：`/r-markdown/`（GitHub Actions 环境下自动设置）
- 本地开发：`/`

### 预览构建产物

```bash
pnpm preview
```

## 注意事项

1. **不要手动编辑 `.vue.js` 文件**：这些是 Vue 编译器生成的临时文件，已在 `.gitignore` 中排除
2. **不要提交 `src/**/\*.js`文件**：TypeScript 源码编译产物，已在`.gitignore` 中排除
3. **修改行内格式化语法后**：同步更新本文档的语法对照表
4. **新增组件后**：同步更新本文档的目录结构和组件解析语法表
5. **构建前确认**：确保 `pnpm check` 通过，无 ESLint/Prettier 错误
