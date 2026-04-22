# 依赖变更矩阵

> 项目: omg-inject-html-webpack-plugin v1.3.3 → v2.0.0
> 日期: 2026-04-22

---

## 1. 依赖移动

| 包名 | 原位置 | 新位置 | 目标版本 | 原因 |
|---|---|---|---|---|
| html-webpack-plugin | dependencies | peerDependencies | >= 5.0.0 | 符合 webpack 插件生态惯例；用户控制版本 |
| html-webpack-plugin | — | devDependencies | ^5.6.6 | 用于示例开发和测试 |

---

## 2. 删除的依赖

| 包名 | 原位置 | 原版本 | 删除原因 | 替代方案 |
|---|---|---|---|---|
| extract-text-webpack-plugin | devDependencies | 4.0.0-beta.0 | 不兼容 webpack 5，已废弃 | 已使用 mini-css-extract-plugin |
| node-sass | devDependencies | 4.12.0 | 已废弃，不再维护 | `sass` (Dart Sass) |
| file-loader | devDependencies | 4.2.0 | webpack 5 Asset Modules 替代 | `type: 'asset/resource'` |
| url-loader | devDependencies | 2.1.0 | webpack 5 Asset Modules 替代 | `type: 'asset'` |
| uglify-js | devDependencies | 3.3.23 | webpack 5 内置 Terser | 无需额外包 |
| underscore | devDependencies | 1.8.3 | 源码中未使用 | 无 |
| open-browser-webpack-plugin | devDependencies | 0.0.5 | 未维护，不兼容 webpack 5 | `devServer.open: true` |
| react-lazyload | devDependencies | 2.2.7 | 示例中未使用 | 无 |
| react-router | devDependencies | 4.1.1 | 示例中未使用 | 无 |

---

## 3. 新增的依赖

| 包名 | 位置 | 版本 | 用途 |
|---|---|---|---|
| sass | devDependencies | ^1.86.0 | Dart Sass，替代 node-sass |
| html-webpack-plugin | devDependencies | ^5.6.6 | 示例和测试用 |
| jest | devDependencies | ^30.0.0 | 测试框架 |
| memfs | devDependencies | ^4.17.0 | 内存文件系统 (测试 mock) |

---

## 4. 版本升级

### 4.1 核心构建工具

| 包名 | 当前版本 | 目标版本 | 破坏性变更 |
|---|---|---|---|
| webpack | 4.39.3 | ^5.98.0 | [Migration Guide](https://webpack.js.org/migrate/5/) |
| webpack-cli | 3.3.7 | ^6.0.1 | 命令行参数变更 |
| webpack-dev-server | 3.8.0 | ^5.2.1 | 配置 API 大幅变更 |

### 4.2 Babel 生态

| 包名 | 当前版本 | 目标版本 | 破坏性变更 |
|---|---|---|---|
| @babel/core | 7.5.5 | ^7.26.10 | 无（次要版本升级） |
| @babel/preset-env | 7.5.5 | ^7.26.9 | `debug` 选项已移除 |
| @babel/preset-react | 7.0.0 | ^7.26.3 | 默认使用 automatic runtime |
| @babel/plugin-proposal-class-properties | 7.5.5 | ^7.18.6 | 无 |
| @babel/plugin-transform-runtime | 7.5.5 | ^7.26.3 | 无 |
| @babel/runtime-corejs3 | 7.5.5 | ^7.26.10 | 无 |
| babel-loader | 8.0.6 | ^10.0.0 | 仅支持 webpack 5 |

### 4.3 CSS/样式

| 包名 | 当前版本 | 目标版本 | 破坏性变更 |
|---|---|---|---|
| css-loader | 3.2.0 | ^7.1.2 | 配置 API 变更 |
| style-loader | 1.0.0 | ^4.0.0 | 无重大变更 |
| sass-loader | 8.0.0 | ^16.0.5 | 默认使用 `sass` (Dart) |
| postcss-loader | 3.0.0 | ^8.1.1 | `postcssOptions` 替代 `plugins` |
| autoprefixer | 9.6.1 | ^10.4.21 | 无重大变更 |
| mini-css-extract-plugin | 0.8.0 | ^2.9.2 | loader 导入路径变更 |

### 4.4 模板引擎

| 包名 | 当前版本 | 目标版本 | 破坏性变更 |
|---|---|---|---|
| handlebars | 4.2.0 | ^4.7.8 | 无（补丁升级） |
| handlebars-loader | 1.7.1 | ^1.7.3 | 无（补丁升级） |
| html-loader | 0.5.5 | ^5.1.0 | 配置 API 变更 |
| nunjucks | 3.2.0 | ^3.2.4 | 无（补丁升级） |

### 4.5 React (示例依赖)

| 包名 | 当前版本 | 目标版本 | 破坏性变更 |
|---|---|---|---|
| react | 16.2.0 | ^18.3.1 | `ReactDOM.render` 弃用警告 |
| react-dom | 16.2.0 | ^18.3.1 | 同上 |

### 4.6 其他

| 包名 | 当前版本 | 目标版本 | 破坏性变更 |
|---|---|---|---|
| svg-sprite-loader | 4.1.6 | ^6.0.11 | webpack 5 支持 |
| expose-loader | 0.7.5 | ^5.0.1 | webpack 5 支持 |
| webpack-bundle-analyzer | 2.13.1 | ^4.10.2 | webpack 5 支持 |
| moment | 2.24.0 | ^2.30.1 | 无（补丁升级） |

---

## 5. 保持不变

| 包名 | 版本 | 原因 |
|---|---|---|
| @eagleeye-jssdk/loader | 1.6.0 | 外部 SDK，需单独验证 |
| nunjucks-html-loader | 1.1.0 | 可能需要寻找 webpack 5 兼容替代 |
| nunjucks-webpack-plugin | 5.0.0 | 可能需要寻找 webpack 5 兼容替代 |

---

## 6. package.json 完整预览

```json
{
  "name": "omg-inject-html-webpack-plugin",
  "version": "2.0.0",
  "description": "A webpack plugin for custom HTML resource injection with inline support",
  "main": "index.js",
  "exports": {
    ".": {
      "require": "./index.js",
      "import": "./index.mjs"
    }
  },
  "files": [
    "index.js",
    "index.mjs",
    "lib",
    "README.md",
    "CHANGELOG.md",
    "package.json"
  ],
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "test": "jest",
    "test:unit": "jest test/unit",
    "test:integration": "jest test/integration",
    "test:coverage": "jest --coverage",
    "default": "NODE_ENV=development webpack --config ./example/default/webpack.config.js",
    "ejs": "NODE_ENV=development webpack --config ./example/ejs/webpack.config.js",
    "hbs": "NODE_ENV=development webpack --config ./example/hbs/webpack.config.js",
    "inline": "NODE_ENV=production webpack --config ./example/inline/webpack.config.js",
    "inline-s": "NODE_ENV=development webpack-dev-server --config ./example/inline/webpack.config.js"
  },
  "peerDependencies": {
    "html-webpack-plugin": ">=5.0.0"
  },
  "peerDependenciesMeta": {
    "html-webpack-plugin": {
      "optional": false
    }
  },
  "devDependencies": {
    "@babel/core": "^7.26.10",
    "@babel/plugin-proposal-class-properties": "^7.18.6",
    "@babel/plugin-transform-runtime": "^7.26.3",
    "@babel/preset-env": "^7.26.9",
    "@babel/preset-react": "^7.26.3",
    "@babel/runtime-corejs3": "^7.26.10",
    "@eagleeye-jssdk/loader": "1.6.0",
    "autoprefixer": "^10.4.21",
    "babel-loader": "^10.0.0",
    "css-loader": "^7.1.2",
    "expose-loader": "^5.0.1",
    "handlebars": "^4.7.8",
    "handlebars-loader": "^1.7.3",
    "html-loader": "^5.1.0",
    "html-webpack-plugin": "^5.6.6",
    "jest": "^30.0.0",
    "memfs": "^4.17.0",
    "mini-css-extract-plugin": "^2.9.2",
    "moment": "^2.30.1",
    "nunjucks": "^3.2.4",
    "nunjucks-html-loader": "1.1.0",
    "nunjucks-webpack-plugin": "5.0.0",
    "postcss-loader": "^8.1.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "sass": "^1.86.0",
    "sass-loader": "^16.0.5",
    "style-loader": "^4.0.0",
    "svg-sprite-loader": "^6.0.11",
    "webpack": "^5.98.0",
    "webpack-bundle-analyzer": "^4.10.2",
    "webpack-cli": "^6.0.1",
    "webpack-dev-server": "^5.2.1"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/Ncnbb/omg-inject-html-webpack-plugin.git"
  },
  "author": "",
  "license": "ISC",
  "bugs": {
    "url": "https://github.com/Ncnbb/omg-inject-html-webpack-plugin/issues"
  },
  "homepage": "https://github.com/Ncnbb/omg-inject-html-webpack-plugin#readme"
}
```

---

## 7. 升级操作顺序

```bash
# 1. 创建升级分支
git checkout -b feat/webpack-5-upgrade

# 2. 删除旧依赖
npm uninstall extract-text-webpack-plugin node-sass file-loader url-loader uglify-js underscore open-browser-webpack-plugin react-lazyload react-router

# 3. 安装新依赖
npm install sass@^1.86.0 --save-dev
npm install html-webpack-plugin@^5.6.6 --save-dev

# 4. 批量升级其余依赖
npm install webpack@^5.98.0 webpack-cli@^6.0.1 webpack-dev-server@^5.2.1 --save-dev
npm install @babel/core@^7.26.10 @babel/preset-env@^7.26.9 @babel/preset-react@^7.26.3 --save-dev
npm install @babel/plugin-proposal-class-properties@^7.18.6 @babel/plugin-transform-runtime@^7.26.3 @babel/runtime-corejs3@^7.26.10 --save-dev
npm install babel-loader@^10.0.0 --save-dev
npm install css-loader@^7.1.2 style-loader@^4.0.0 sass-loader@^16.0.5 --save-dev
npm install postcss-loader@^8.1.1 autoprefixer@^10.4.21 --save-dev
npm install mini-css-extract-plugin@^2.9.2 html-loader@^5.1.0 --save-dev
npm install handlebars@^4.7.8 handlebars-loader@^1.7.3 --save-dev
npm install react@^18.3.1 react-dom@^18.3.1 --save-dev
npm install svg-sprite-loader@^6.0.11 expose-loader@^5.0.1 --save-dev
npm install webpack-bundle-analyzer@^4.10.2 moment@^2.30.1 nunjucks@^3.2.4 --save-dev

# 5. 安装测试依赖
npm install jest@^30.0.0 memfs@^4.17.0 --save-dev
```

> **注意**: 以上命令执行后，需手动编辑 package.json 添加 peerDependencies、engines、exports 字段。
