/**
 * 组件注册中心
 *
 * 编号规则：
 *   Dxxx = 系统默认组件（Default）
 *   Cxxx = 定制组件（Custom）
 *
 * 每个组件导出：
 *   id       - 编号，如 'D001'
 *   name     - 组件中文名
 *   tag      - 编辑器标签名，如 'title'
 *   attrs    - 属性定义数组 [{ key, label, default, required }]
 *   example  - 编辑器侧示例代码（Markdown/类HTML）
 *   render   - (attrs, body, theme) => HTML（内联样式，可直接粘贴公众号）
 */
import { D001_title } from './D001Title';
import { ReadingPath } from './ReadingPath';

export const components = [D001_title, ReadingPath];

/** 按 id 索引 */
export const componentMap = Object.fromEntries(components.map(c => [c.id, c]));

/** 按 tag 索引（编辑器解析用） */
export const tagMap = Object.fromEntries(components.map(c => [c.tag, c]));
