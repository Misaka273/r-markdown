/**
 * 组件注册中心
 *
 * 编号规则：
  *   命名规则：{组件类型}_{D}{类型字母}{样式编号}
 *     D = Default（默认组件），C = Custom（定制组件）
 *     A-Z = 同类型不同变体，01-99 = 同变体不同样式
 *     示例：Title_DA01 = 标题-默认-A型-01号样式
 *
 * 每个组件导出：
 *   id       - 编号，如 'Title_DA01'
 *   name     - 组件中文名
 *   tag      - 编辑器标签名，如 'title'
 *   attrs    - 属性定义数组 [{ key, label, default, required }]
 *   example  - 编辑器侧示例代码（Markdown/类HTML）
 *   render   - (attrs, body, theme) => HTML（内联样式，可直接粘贴公众号）
 */
import { Title_DA01 } from './Title_DA01';
import { ReadingPath_DA01 } from './ReadingPath_DA01';
import { PTitle } from './PTitle_DA01';
import { Breaking_DA01 } from './Breaking_DA01';
import { Steps_DA01 } from './Steps_DA01';

export const components = [Title_DA01, ReadingPath_DA01, PTitle, Breaking_DA01, Steps_DA01];

/** 按 id 索引 */
export const componentMap = Object.fromEntries(components.map(c => [c.id, c]));

/** 按 tag 索引（编辑器解析用） */
export const tagMap = Object.fromEntries(components.map(c => [c.tag, c]));
