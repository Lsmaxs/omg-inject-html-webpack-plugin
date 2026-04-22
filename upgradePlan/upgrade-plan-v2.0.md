# omg-inject-html-webpack-plugin v2.0 升级计划

> 版本: 2.0.0 | 编制日期: 2026-04-22 | 状态: 待执行

---

## 目录

1. [执行摘要](#1-执行摘要)
2. [当前状态分析](#2-当前状态分析)
3. [阶段一：依赖审计与准备](#3-阶段一依赖审计与准备)
4. [阶段二：插件核心重构](#4-阶段二插件核心重构)
5. [阶段三：Webpack 5 配置迁移](#5-阶段三webpack-5-配置迁移)
6. [阶段四：示例项目迁移](#6-阶段四示例项目迁移)
7. [阶段五：测试基础设施](#7-阶段五测试基础设施)
8. [阶段六：文档与 CI/CD](#8-阶段六文档与-cicd)
9. [风险评估矩阵](#9-风险评估矩阵)
10. [回滚方案](#10-回滚方案)
11. [时间节点安排](#11-时间节点安排)
12. [验收标准与成功指标](#12-验收标准与成功指标)

---

## 1. 执行摘要

### 1.1 项目概况

| 项目 | 值 |
|---|---|
| 包名 | omg-inject-html-webpack-plugin |
| 当前版本 | 1.3.3 |
| 构建工具 | webpack 4.39.3 |
| 核心依赖 | html-webpack-plugin 4.0.0-beta.8 |
| 模块格式 | CommonJS |
| Node.js 要求 | 未声明 |
| 测试覆盖 | 0%（无测试） |
| CI/CD | 无 |

### 1.2 升级目标

| 目标 | 升级后 |
|---|---|
| 构建工具 | webpack 5.98.x |
| 核心依赖 | html-webpack-plugin >= 5.0.0 (peerDependency) |
| 模块格式 | CJS + ESM 双模式 |
| Node.js 要求 | >= 18.0.0 |
| 测试覆盖 | > 80% |
| CI/CD | GitHub Actions (Node 18/20/22) |

### 1.3 核心破坏性变更

1. **html-webpack-plugin 从 dependencies 移至 peerDependencies** — 用户需自行安装
2. **templateParameters 回调参数结构变更** — `{ head, body }` → `{ headTags, bodyTags }`
3. **最低 Node.js 版本要求** — 从无限制变为 >= 18.0.0
4. **移除同步文件 I/O** — `fs.readFileSync` → `fs.promises.readFile`

---

## 2. 当前状态分析

### 2.1 项目结构

```
omg-inject-html-webpack-plugin/
├── index.js                          # 插件入口 (175 行)
├── lib/utils/typeof.js               # 类型判断工具
├── webpack.config.js                 # 基础 webpack 配置
├── package.json                      # 包清单
├── package-lock.json                 # 依赖锁定 (v1 格式)
├── README.md                         # 文档 (中文)
├── .npmignore                        # npm 发布忽略
├── .vscode/launch.json               # VS Code 调试配置
└── example/
    ├── default/                      # 默认模板示例
    ├── ejs/                          # EJS 模板示例
    ├── hbs/                          # Handlebars 模板示例
    └── inline/                       # 内联资源示例
```

### 2.2 技术债务清单

| 类别 | 问题 | 严重程度 |
|---|---|---|
| **依赖** | html-webpack-plugin 锁定在 beta 版 (4.0.0-beta.8) | 严重 |
| **依赖** | 无 peerDependencies 声明 | 高 |
| **依赖** | extract-text-webpack-plugin 已废弃且不兼容 webpack 5 | 高 |
| **依赖** | node-sass 已废弃 | 中 |
| **依赖** | file-loader / url-loader 在 webpack 5 中被 Asset Modules 替代 | 中 |
| **代码** | 第 46 行逻辑 bug：`\|\|` 应为 `&&` | 高 |
| **代码** | 使用 `fs.readFileSync` 阻塞事件循环 | 中 |
| **代码** | 30 行注释代码未清理 (第 126-156 行) | 低 |
| **代码** | 无输入验证 | 中 |
| **质量** | 无单元测试 | 高 |
| **质量** | 无 CI/CD 流水线 | 高 |
| **质量** | 无 TypeScript 类型定义 | 低 |
| **配置** | webpack 配置使用 `module._chunks` 内部 API | 高 |
| **配置** | postcss-loader 使用过时配置格式 | 中 |
| **配置** | devServer 使用 `disableHostCheck` (已废弃) | 低 |

### 2.3 插件核心 API 分析

当前 `index.js` 使用的 webpack / html-webpack-plugin API：

```javascript
// 第 158-172 行：apply 方法
compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
    const hooks = HtmlWebpackPlugin.getHooks(compilation);          // ← HWP v4 API
    hooks.beforeAssetTagGeneration.tapAsync(PLUGIN_NAME, (data, cb) => {
        data.plugin.options.templateParameters = (compilation, assets, assetTags, options) => {
            // assetTags 在 v4 中是 { head: [...], body: [...] }
            // 在 v5 中是 { headTags: [...], bodyTags: [...] }
            // ↑ 这是核心破坏性变更
            return this.createInlineStaticObject(compilation, () => {
                return this.templateParametersGenerator(compilation, assets, assetTags, options)
            })
        }
        cb(null, data);
    });
});
```

---

## 3. 阶段一：依赖审计与准备

> **工期**: 0.5 天 | **前置条件**: 无

### 3.1 依赖变更操作

详见 [dependency-matrix.md](./dependency-matrix.md) 获取完整版本映射。

#### 3.1.1 移动依赖

| 包名 | 原位置 | 新位置 | 目标版本 |
|---|---|---|---|
| html-webpack-plugin | dependencies | peerDependencies | >= 5.0.0 |

同时在 devDependencies 中添加 `html-webpack-plugin@5.6.6` 用于示例项目开发和测试。

#### 3.1.2 删除废弃依赖 (9 个)

| 包名 | 删除原因 | 替代方案 |
|---|---|---|
| `extract-text-webpack-plugin` | 不兼容 webpack 5 | 已使用 mini-css-extract-plugin |
| `node-sass` | 已废弃 | `sass` (Dart Sass) |
| `file-loader` | webpack 5 Asset Modules 替代 | 内置 `type: 'asset/resource'` |
| `url-loader` | webpack 5 Asset Modules 替代 | 内置 `type: 'asset'` |
| `uglify-js` | webpack 5 内置 Terser | 无需额外包 |
| `underscore` | 源码未使用 | 无 |
| `open-browser-webpack-plugin` | 未维护 | `devServer.open: true` |
| `react-lazyload` | 示例未使用 | 无 |
| `react-router` | 示例未使用 | 无 |

#### 3.1.3 新增依赖

| 包名 | 版本 | 用途 |
|---|---|---|
| `sass` | ^1.86.0 | 替代 node-sass (Dart Sass) |

#### 3.1.4 版本升级 (25+ 包)

| 包名 | 当前版本 | 目标版本 | 注意事项 |
|---|---|---|---|
| webpack | 4.39.3 | ^5.98.0 | 核心升级 |
| webpack-cli | 3.3.7 | ^6.0.1 | 适配 webpack 5 |
| webpack-dev-server | 3.8.0 | ^5.2.1 | API 有破坏性变更 |
| @babel/core | 7.5.5 | ^7.26.10 | |
| @babel/preset-env | 7.5.5 | ^7.26.9 | 移除 `debug` 选项 |
| @babel/preset-react | 7.0.0 | ^7.26.3 | 添加 `runtime: 'classic'` |
| @babel/plugin-proposal-class-properties | 7.5.5 | ^7.18.6 | |
| @babel/plugin-transform-runtime | 7.5.5 | ^7.26.3 | |
| @babel/runtime-corejs3 | 7.5.5 | ^7.26.10 | |
| babel-loader | 8.0.6 | ^10.0.0 | 仅支持 webpack 5 |
| css-loader | 3.2.0 | ^7.1.2 | |
| style-loader | 1.0.0 | ^4.0.0 | |
| sass-loader | 8.0.0 | ^16.0.5 | 需要 `sass` 而非 `node-sass` |
| postcss-loader | 3.0.0 | ^8.1.1 | 配置格式变更 |
| autoprefixer | 9.6.1 | ^10.4.21 | |
| mini-css-extract-plugin | 0.8.0 | ^2.9.2 | |
| html-loader | 0.5.5 | ^5.1.0 | |
| handlebars | 4.2.0 | ^4.7.8 | |
| handlebars-loader | 1.7.1 | ^1.7.3 | 兼容 webpack 5 |
| react | 16.2.0 | ^18.3.1 | 示例依赖 |
| react-dom | 16.2.0 | ^18.3.1 | 示例依赖 |
| svg-sprite-loader | 4.1.6 | ^6.0.11 | |
| expose-loader | 0.7.5 | ^5.0.1 | |
| webpack-bundle-analyzer | 2.13.1 | ^4.10.2 | |
| moment | 2.24.0 | ^2.30.1 | |
| nunjucks | 3.2.0 | ^3.2.4 | |

#### 3.1.5 保留不变

| 包名 | 版本 | 原因 |
|---|---|---|
| `@eagleeye-jssdk/loader` | 1.6.0 | 外部 SDK，需验证兼容性 |
| `nunjucks-html-loader` | 1.1.0 | 可能需要寻找替代 |
| `nunjucks-webpack-plugin` | 5.0.0 | 可能需要寻找替代 |

### 3.2 package.json 新增字段

```json
{
  "version": "2.0.0",
  "engines": {
    "node": ">=18.0.0"
  },
  "exports": {
    ".": {
      "require": "./index.js",
      "import": "./index.mjs"
    }
  },
  "peerDependencies": {
    "html-webpack-plugin": ">=5.0.0"
  },
  "peerDependenciesMeta": {
    "html-webpack-plugin": {
      "optional": false
    }
  },
  "files": [
    "index.js",
    "index.mjs",
    "lib",
    "README.md",
    "CHANGELOG.md",
    "package.json"
  ]
}
```

### 3.3 验收标准

- [ ] `package.json` 版本更新为 `2.0.0`
- [ ] `html-webpack-plugin` 已移至 `peerDependencies`
- [ ] `engines` 字段声明 `node >= 18.0.0`
- [ ] `exports` 字段支持双模式
- [ ] 9 个废弃包已从 devDependencies 中移除
- [ ] `sass` 已添加到 devDependencies
- [ ] `npm install` 无错误无警告
- [ ] `npm ls` 无缺失依赖

---

## 4. 阶段二：插件核心重构

> **工期**: 2 天 | **前置条件**: 阶段一完成

### 4.1 html-webpack-plugin v4 → v5 API 变更详解

#### 4.1.1 `getHooks` → `getCompilationHooks`

```javascript
// v4 (当前)
const hooks = HtmlWebpackPlugin.getHooks(compilation);

// v5 (推荐)
const hooks = HtmlWebpackPlugin.getCompilationHooks(compilation);
```

> `getHooks` 在 v5 中仍作为别名存在，但 `getCompilationHooks` 是推荐的新 API。

#### 4.1.2 `templateParameters` 回调参数签名

```javascript
// v4 (当前) — assetTags 结构
(compilation, assets, assetTags, options) => {
    // assetTags = { head: [HtmlTagObject], body: [HtmlTagObject] }
    Object.keys(assetTags) // → ['head', 'body']
}

// v5 (目标) — preparedAssetTags 结构
(compilation, assetsInformationByGroups, preparedAssetTags, options) => {
    // preparedAssetTags = { headTags: HtmlTagArray, bodyTags: HtmlTagArray }
    // 每个 HtmlTagObject 有 { tagName, voidTag, attributes, meta, innerHTML }
}
```

**这是最关键的破坏性变更。** 当前代码第 90 行 `Object.keys(assetTags)` 获取的键将从 `['head', 'body']` 变为 `['headTags', 'bodyTags']`。

#### 4.1.3 `htmlTagObjectToString` 模块

```javascript
// v4 和 v5 中均可用，签名不变
const htmlTags = require('html-webpack-plugin/lib/html-tags');
htmlTags.htmlTagObjectToString(tagObject, xhtml);
```

### 4.2 index.js 代码变更详情

#### 4.2.1 修复逻辑 bug（第 46 行）

```javascript
// 当前 (bug: 条件恒为 true)
if ( file[0] != '/' || file[0] != '.' ) {

// 修复后
if ( file[0] != '/' && file[0] != '.' ) {
```

#### 4.2.2 删除注释代码（第 126-156 行）

删除 `compiler.hooks.beforeRun.tapAsync` 的整段注释代码。

#### 4.2.3 重写 `templateParametersGenerator` 方法

```javascript
templateParametersGenerator ( compilation, assets, assetTags, options ) {
    const _self = this;
    options.inject = _self.options.inject;

    if ( options.inject ) {
        return {
            compilation: compilation,
            webpackConfig: compilation.options,
            htmlWebpackPlugin: {
                tags: assetTags,
                files: assets,
                options: options
            }
        };
    }

    const xhtml = options.xhtml;
    const inject = options.inject;
    const crossOriginLoading = compilation.options.output.crossOriginLoading;

    const newAssets = {
        js: [],
        css: [],
        manifest: assets.manifest,
        favicon: assets.favicon,
    };

    // v5: assetTags 是 { headTags: HtmlTagArray, bodyTags: HtmlTagArray }
    [ 'headTags', 'bodyTags' ].forEach( ( key ) => {
        const tags = assetTags[key];
        if ( tags ) {
            tags.forEach( ( item ) => {
                item.attributes = !item.attributes ? {} : item.attributes;
                if ( crossOriginLoading ) {
                    item.attributes.crossorigin = crossOriginLoading;
                }
                _self.createNewAssetsObject( newAssets, item, xhtml );
            } );
        }
    } );

    return {
        assets: newAssets,
        inline: { ...this.inlineFileContent },
        ..._self.options.templateParameters
    };
}
```

#### 4.2.4 `createInlineStaticObject` 异步化

```javascript
async createInlineStaticObject ( compilation ) {
    const entrys = compilation.options.entry;
    const regex = /\?__inline/;
    const { promises: fsp } = require( 'fs' );

    if ( isObject( entrys ) ) {
        const entryKeys = Object.keys( entrys );
        for ( const entry of entryKeys ) {
            let target = entrys[entry];
            target = isArray( target ) ? target[target.length - 1] : target;

            if ( regex.test( target ) ) {
                const [file] = target.split( '?' );
                let filePath = '';
                if ( file[0] != '/' && file[0] != '.' ) {
                    filePath = path.join( this.cwd, './node_modules', file );
                } else {
                    filePath = path.join( this.cwd, file );
                }

                if ( cacheContent[filePath] ) {
                    this.inlineFileContent[entry] = `<script>${cacheContent[filePath]}</script>`;
                } else {
                    try {
                        const content = await fsp.readFile( filePath, 'utf8' );
                        this.inlineFileContent[entry] = `<script>${content}</script>`;
                        cacheContent[filePath] = content;
                    } catch ( e ) {
                        // 文件不存在，静默跳过
                    }
                }
            }
        }
    }
}
```

#### 4.2.5 更新 `apply` 方法

```javascript
apply ( compiler ) {
    compiler.hooks.compilation.tap( PLUGIN_NAME, ( compilation ) => {
        const hooks = HtmlWebpackPlugin.getCompilationHooks( compilation );
        hooks.beforeAssetTagGeneration.tapAsync( PLUGIN_NAME, async ( data, cb ) => {
            data.plugin.options.templateParameters = async ( compilation, assets, assetTags, options ) => {
                await this.createInlineStaticObject( compilation );
                return this.templateParametersGenerator( compilation, assets, assetTags, options );
            };
            cb( null, data );
        } );
    } );
}
```

#### 4.2.6 构造函数输入验证

```javascript
constructor ( options ) {
    const defaultOptions = {
        inject: false,
        htmlDir: '',
        templateParameters: {},
    };
    this.options = Object.assign( defaultOptions, options );
    if ( this.options.inject !== undefined && typeof this.options.inject !== 'boolean' ) {
        throw new Error( `[${PLUGIN_NAME}] options.inject must be a boolean` );
    }
    this.cwd = process.cwd();
    this.inlineFileContent = {};
}
```

### 4.3 新建 index.mjs（ESM 导出）

创建 `/index.mjs`，内容与 `index.js` 相同但使用 ESM 语法：

```javascript
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { htmlTagObjectToString } from 'html-webpack-plugin/lib/html-tags.js';
import { isString, isArray, isObject } from './lib/utils/typeof.js';
import path from 'path';
import { promises as fsp } from 'fs';

const PLUGIN_NAME = 'omg-inject-html-webpack-plugin';
const cacheContent = {};

class OmgInjectHtmlWebpackPlugin {
    // ... 与 CJS 版本相同的类实现
}

export default OmgInjectHtmlWebpackPlugin;
```

### 4.4 验收标准

- [ ] 第 46 行逻辑 bug 已修复 (`||` → `&&`)
- [ ] 注释代码块已删除
- [ ] 使用 `HtmlWebpackPlugin.getCompilationHooks()` 替代 `getHooks()`
- [ ] `templateParametersGenerator` 正确处理 `{ headTags, bodyTags }` 结构
- [ ] `createInlineStaticObject` 使用 `fs.promises.readFile` (异步)
- [ ] 构造函数包含输入验证
- [ ] `index.mjs` 存在且导出正确
- [ ] 插件能在 `html-webpack-plugin@5.x` 下实例化无报错

---

## 5. 阶段三：Webpack 5 配置迁移

> **工期**: 1 天 | **前置条件**: 阶段二完成

### 5.1 webpack.config.js 变更

#### 5.1.1 url-loader → Asset Modules

```javascript
// 删除
{
    test: /\.(woff|woff2|eot|ttf|jpg|png|gif)\??.*$/,
    loader: 'url-loader',
    query: { limit: 8192, name: 'images/[name].[ext]' }
}

// 替换为
{
    test: /\.(woff|woff2|eot|ttf)$/,
    type: 'asset/resource',
    generator: { filename: 'fonts/[name].[ext]' }
},
{
    test: /\.(jpg|png|gif)$/,
    type: 'asset',
    parser: { dataUrlCondition: { maxSize: 8192 } },
    generator: { filename: 'images/[name].[ext]' }
}
```

#### 5.1.2 postcss-loader 配置迁移

```javascript
// 当前
{
    loader: 'postcss-loader',
    options: {
        ident: 'postcss',
        plugins: [ require('autoprefixer')({...}) ]
    }
}

// 迁移后
{
    loader: 'postcss-loader',
    options: {
        postcssOptions: {
            plugins: [ require('autoprefixer')({...}) ]
        }
    }
}
```

#### 5.1.3 splitChunks 修复 (module._chunks)

```javascript
// 当前 (第 165、193 行)
name: ( module, chunks, cacheGroupKey ) => {
    const arr = [];
    module._chunks.forEach( ( chunk ) => { arr.push( chunk.name ) } )

// 修复后
name: ( module, chunks, cacheGroupKey ) => {
    const arr = [];
    chunks.forEach( ( chunk ) => { arr.push( chunk.name ) } )
```

> `module._chunks` 是 webpack 内部 API，在 v5 中已移除。`name` 函数的第二个参数 `chunks` 提供了相同功能。

#### 5.1.4 devServer 配置迁移

```javascript
// 删除
disableHostCheck: true

// 删除 setup 注释 (如需自定义中间件，使用 v5 的 setupMiddlewares)
```

#### 5.1.5 Babel 配置更新

```javascript
// 移除 debug: false (已废弃)
// @babel/preset-react 添加 runtime 配置
[ require( '@babel/preset-react' ).default, { runtime: 'classic' } ]
```

### 5.2 Node.js Polyfills

webpack 5 不再自动注入 Node.js 核心模块 polyfill。经分析，当前项目源码不使用 Node.js 内置模块（`Buffer`、`process` 等），因此不需要添加 `resolve.fallback`。

如果构建时出现 `Module not found` 错误，按需添加：

```javascript
resolve: {
    fallback: {
        // 仅在构建报错时添加
    }
}
```

### 5.3 验收标准

- [ ] `url-loader` 已替换为 Asset Modules
- [ ] `postcss-loader` 使用 `postcssOptions` 格式
- [ ] `module._chunks` 已替换为 `chunks` 参数
- [ ] `disableHostCheck` 已移除
- [ ] `debug: false` 已从 babel 配置中移除
- [ ] `@babel/preset-react` 包含 `runtime: 'classic'`
- [ ] 根配置无构建错误

---

## 6. 阶段四：示例项目迁移

> **工期**: 1 天 | **前置条件**: 阶段三完成

### 6.1 迁移策略

所有示例通过 `require('../../webpack.config')` 继承基配置。基配置更新后，大部分变更自动传播。

### 6.2 各示例变更

| 示例 | 变更需求 | 说明 |
|---|---|---|
| `example/default/` | 无 | 继承基配置即可 |
| `example/ejs/` | 无 | 继承基配置即可 |
| `example/hbs/` | 无 | 继承基配置即可 |
| `example/inline/` | 验证 `?__inline` | webpack 5 可能规范化 entry 格式，需手动验证 |

### 6.3 inline 示例特殊处理

webpack 5 对 `entry` 的内部表示做了规范化：

```javascript
// webpack 4: compilation.options.entry = { app: './src/app.js', eaentry: '@eagleeye/...?__inline' }
// webpack 5: compilation.options.entry 可能规范化为 descriptor 对象

// 需验证 entry 值是否仍为字符串或被包装为 { import: ['./src/app.js'] }
```

如果 entry 被规范化，需更新 `createInlineStaticObject` 中的 entry 解析逻辑。

### 6.4 验收标准

- [ ] `npm run default` 构建成功
- [ ] `npm run ejs` 构建成功
- [ ] `npm run hbs` 构建成功
- [ ] `npm run inline` 构建成功
- [ ] 输出 HTML 包含正确的 `<script>` 和 `<link>` 标签
- [ ] 输出 HTML 包含 `crossorigin="anonymous"` 属性
- [ ] inline 模式正确生成 `<script>...</script>` 内联内容
- [ ] Handlebars 模板 `{{{inline.eaentry}}}` 正确渲染
- [ ] CSS 文件正确提取和链接

---

## 7. 阶段五：测试基础设施

> **工期**: 2 天 | **前置条件**: 阶段四完成

### 7.1 测试框架

| 工具 | 版本 | 用途 |
|---|---|---|
| jest | ^30.0.0 | 测试框架 |
| memfs | ^4.17.0 | 内存文件系统 (mock fs) |

### 7.2 测试目录结构

```
test/
├── unit/
│   ├── typeof.test.js                        # 类型判断工具测试
│   ├── createNewAssetsObject.test.js          # HTML 标签生成测试
│   ├── createInlineStaticObject.test.js       # 内联文件读取测试
│   └── templateParametersGenerator.test.js    # 模板参数生成测试
└── integration/
    ├── default.test.js                        # 默认示例构建测试
    ├── ejs.test.js                            # EJS 示例构建测试
    ├── hbs.test.js                            # Handlebars 示例构建测试
    └── inline.test.js                         # 内联示例构建测试
```

### 7.3 关键测试用例

#### 单元测试

| 测试文件 | 测试用例 |
|---|---|
| `typeof.test.js` | isString, isArray, isObject 对各种类型的判断 |
| `createNewAssetsObject.test.js` | 生成 `<script>` 标签字符串；生成 `<link>` 标签字符串；xhtml 模式自闭合标签 |
| `createInlineStaticObject.test.js` | `?__inline` 条目解析；node_modules 文件路径解析；缓存命中跳过读取；文件不存在静默处理 |
| `templateParametersGenerator.test.js` | `inject: false` 返回 assets + inline 结构；`inject: true` 返回 htmlWebpackPlugin 默认结构；crossorigin 属性注入；templateParameters 合并 |

#### 集成测试

| 测试文件 | 测试用例 |
|---|---|
| `default.test.js` | webpack 构建无错误；输出 HTML 存在；HTML 包含正确的资源引用 |
| `hbs.test.js` | Handlebars 编译正确；`{{#each}}` 循环渲染；`{{{inline.*}}}` 变量解析 |
| `inline.test.js` | 内联脚本嵌入 HTML；外部脚本不嵌入而是链接 |

### 7.4 npm scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest test/unit",
    "test:integration": "jest test/integration",
    "test:coverage": "jest --coverage"
  }
}
```

### 7.5 验收标准

- [ ] `npm test` 全部通过
- [ ] 单元测试覆盖 `typeof.js`、`createNewAssetsObject`、`createInlineStaticObject`、`templateParametersGenerator`
- [ ] 集成测试覆盖 4 个示例项目
- [ ] `index.js` 覆盖率 > 80%
- [ ] 在 Node.js 18、20、22 下均通过

---

## 8. 阶段六：文档与 CI/CD

> **工期**: 1 天 | **前置条件**: 阶段五完成

### 8.1 GitHub Actions CI

创建 `.github/workflows/ci.yml`：

```yaml
name: CI
on:
  push:
    branches: [master, feat/webpack-5-upgrade]
  pull_request:
    branches: [master]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm test
      - run: npm run default
      - run: npm run ejs
      - run: npm run hbs
      - run: npm run inline

  publish-dry-run:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm publish --dry-run
```

### 8.2 CHANGELOG.md

```markdown
# Changelog

## 2.0.0 (2026-04-XX)

### Breaking Changes
- Requires Node.js >= 18.0.0
- `html-webpack-plugin` is now a peerDependency (>= 5.0.0)
- Removed from `dependencies`: `html-webpack-plugin` (install separately)
- `templateParameters` callback receives v5-shaped `assetTags` (`{ headTags, bodyTags }`)
- `options.inject` now requires boolean type (throws on invalid input)

### Features
- Webpack 5 support
- html-webpack-plugin 5.x support
- Dual CJS/ESM module export (`index.js` / `index.mjs`)
- Async file I/O for inline mode (`fs.promises.readFile`)
- Added input validation to constructor

### Bug Fixes
- Fixed logical bug in file path resolution (`||` → `&&`)

### Removed
- Removed commented-out code from v1.x
- Removed deprecated devDependencies
```

### 8.3 README.md 更新

更新内容：
- 安装说明：`npm install omg-inject-html-webpack-plugin html-webpack-plugin`
- 版本要求：webpack >= 5.0.0, html-webpack-plugin >= 5.0.0, Node.js >= 18.0.0
- v1.x → v2.0 迁移指南
- 更新所有示例输出

### 8.4 验收标准

- [ ] GitHub Actions CI 在 Node 18/20/22 下全部通过
- [ ] CHANGELOG.md 记录所有破坏性变更
- [ ] README.md 反映 webpack 5 和 HWP 5.x 要求
- [ ] `npm publish --dry-run` 无警告
- [ ] package.json 版本为 `2.0.0`

---

## 9. 风险评估矩阵

| # | 风险 | 可能性 | 影响 | 缓解措施 | 负责阶段 |
|---|---|---|---|---|---|
| R1 | `templateParameters` 参数签名变更 | 高 | 严重 | 阶段二重写 `templateParametersGenerator` | 阶段二 |
| R2 | `module._chunks` 在 webpack 5 中移除 | 高 | 高 | 阶段三替换为 `chunks` 参数 | 阶段三 |
| R3 | webpack 5 entry 规范化影响 inline 模式 | 中 | 高 | 手动验证 inline 示例，必要时更新 entry 解析 | 阶段四 |
| R4 | `postcss-loader` 配置格式不兼容 | 高 | 中 | 阶段三迁移到 `postcssOptions` | 阶段三 |
| R5 | `handlebars-loader` 与 webpack 5 不兼容 | 低 | 低 | html-webpack-plugin 5.6.6 已修复兼容性 | 阶段四 |
| R6 | `nunjucks-webpack-plugin` 不兼容 webpack 5 | 低 | 中 | 当前无示例使用，可暂时保留 | 阶段四 |
| R7 | `@eagleeye-jssdk/loader` 兼容性问题 | 中 | 中 | 仅在 inline 示例中使用，验证 node_modules 解析 | 阶段四 |
| R8 | `svg-sprite-loader` v6 配置变更 | 中 | 低 | 验证现有配置兼容性 | 阶段三 |
| R9 | React 18 `ReactDOM.render` 弃用警告 | 低 | 低 | 功能正常，仅控制台警告 | 阶段四 |
| R10 | ESM 导出在某些工具链中不工作 | 中 | 中 | 保留 CJS 作为默认入口，ESM 为可选 | 阶段二 |

---

## 10. 回滚方案

### 10.1 分支策略

```
master (v1.3.3) ← 保持不动，打 tag v1.3.3
  └── feat/webpack-5-upgrade ← 所有升级工作在此分支
        ├── commit: 阶段一 - 依赖更新
        ├── commit: 阶段二 - 核心重构
        ├── commit: 阶段三 - 配置迁移
        ├── commit: 阶段四 - 示例迁移
        ├── commit: 阶段五 - 测试
        └── commit: 阶段六 - 文档与CI
```

### 10.2 增量回滚点

| 回滚点 | 位置 | 状态 | 回滚操作 |
|---|---|---|---|
| RP1 | 阶段二完成后 | 插件核心重构，仍可用 HWP 4.x 测试 | `git revert <commit>` |
| RP2 | 阶段三完成后 | 基配置更新，所有示例应可构建 | `git revert <commit>` |
| RP3 | 阶段四完成后 | 所有示例验证通过 | `git revert <commit>` |
| RP4 | 阶段五完成后 | 测试套件就绪 | `git revert <commit>` |

### 10.3 完全回滚

如需完全回滚：
1. 切回 `master` 分支
2. 如已发布 v2.0.0，执行 `npm deprecate omg-inject-html-webpack-plugin@2.0.0 "请使用 1.3.3"`
3. 在 v1.x 线上发布补丁（如需要）

---

## 11. 时间节点安排

| 阶段 | 工期 | 开始日期 | 结束日期 | 交付物 |
|---|---|---|---|---|
| 阶段一 | 0.5 天 | D1 | D1 | package.json 更新 |
| 阶段二 | 2 天 | D1.5 | D3 | index.js + index.mjs 重构 |
| 阶段三 | 1 天 | D4 | D4 | webpack.config.js 迁移 |
| 阶段四 | 1 天 | D5 | D5 | 4 个示例验证 |
| 阶段五 | 2 天 | D6 | D7 | 测试套件 |
| 阶段六 | 0.5 天 | D7.5 | D7.5 | CI/CD + 文档 |
| **总计** | **7.5 天** | | | **v2.0.0 release candidate** |

---

## 12. 验收标准与成功指标

### 12.1 总体验收标准

| # | 标准 | 验证方式 |
|---|---|---|
| A1 | 所有依赖安装无错误 | `npm install` |
| A2 | 插件核心兼容 HWP 5.x | 单元测试通过 |
| A3 | 4 个示例项目构建成功 | `npm run default/ejs/hbs/inline` |
| A4 | 测试覆盖率 > 80% | `npm run test:coverage` |
| A5 | CI 在 Node 18/20/22 通过 | GitHub Actions |
| A6 | 文档反映 v2.0 变更 | README 审阅 |
| A7 | npm 发布无警告 | `npm publish --dry-run` |

### 12.2 成功指标

| 指标 | 目标值 |
|---|---|
| 测试覆盖率 | > 80% |
| 示例构建成功率 | 100% (4/4) |
| Node.js 兼容版本 | 18, 20, 22 |
| 依赖漏洞 | 0 个高危/严重 |
| npm 包大小 | < 20KB (gzip) |

---

## 附录 A：html-webpack-plugin v5 Hook 数据结构

### `beforeAssetTagGeneration` 回调参数

```javascript
{
    assets: {
        publicPath: string,
        js: string[],        // URL 字符串数组
        css: string[],       // URL 字符串数组
        manifest: string | undefined,
        favicon: string | undefined,
    },
    outputName: string,
    plugin: HtmlWebpackPlugin
}
```

### `templateParameters` 回调参数

```javascript
(
    compilation,               // webpack Compilation 对象
    assetsInformationByGroups, // { publicPath, js: string[], css: string[], manifest?, favicon? }
    preparedAssetTags,         // { headTags: HtmlTagArray, bodyTags: HtmlTagArray }
    options                    // 处理后的 HtmlWebpackPlugin 选项
)
```

### HtmlTagObject 结构

```javascript
{
    tagName: string,           // 'script' | 'link' | 'meta' 等
    voidTag: boolean,          // 自闭合标签
    attributes: {
        [key: string]: string | boolean
    },
    meta: {
        plugin: string         // 来源插件名
    },
    innerHTML: string,         // 标签内部 HTML
    toString: () => string     // 序列化方法
}
```

---

## 附录 B：文件变更清单

| 文件 | 操作 | 变更描述 |
|---|---|---|
| `package.json` | 修改 | 版本升级、依赖变更、新增字段 |
| `index.js` | 修改 | 核心重构、bug 修复、API 迁移 |
| `index.mjs` | **新建** | ESM 导出 |
| `webpack.config.js` | 修改 | Asset Modules、postcss、splitChunks、devServer、babel |
| `example/inline/webpack.config.js` | 验证 | 确认 `?__inline` 兼容性 |
| `example/default/webpack.config.js` | 无变更 | 继承基配置 |
| `example/ejs/webpack.config.js` | 无变更 | 继承基配置 |
| `example/hbs/webpack.config.js` | 无变更 | 继承基配置 |
| `README.md` | 修改 | 版本要求、安装说明、迁移指南 |
| `CHANGELOG.md` | **新建** | 变更日志 |
| `.github/workflows/ci.yml` | **新建** | CI 流水线 |
| `test/unit/*.test.js` | **新建** | 单元测试 (4 个文件) |
| `test/integration/*.test.js` | **新建** | 集成测试 (4 个文件) |
