# omg-inject-html-webpack-plugin

基于 html-webpack-plugin 扩展的可自定义注入资源路径的 webpack 插件。

## 依赖

| 依赖 | 版本要求 |
|---|---|
| webpack | >= 5.0.0 |
| html-webpack-plugin | >= 5.0.0 |
| Node.js | >= 18.0.0 |

## 安装

```shell
npm install omg-inject-html-webpack-plugin html-webpack-plugin --save-dev
```

## 基本使用

```javascript
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InjectHtmlWebpackPlugin = require('omg-inject-html-webpack-plugin');

module.exports = {
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/html/page.hbs',
            filename: './dist/html/page.html',
            xhtml: true
        }),
        new InjectHtmlWebpackPlugin()
    ]
};
```

ESM 导入：

```javascript
import HtmlWebpackPlugin from 'html-webpack-plugin';
import InjectHtmlWebpackPlugin from 'omg-inject-html-webpack-plugin';
```

默认情况下，InjectHtmlWebpackPlugin 会将 HtmlWebpackPlugin 的 `options.inject` 设置为 `false`，并通过模板变量注入资源。

## 跨域配置

在 webpack output 中配置 `crossOriginLoading`，插件会自动将 `crossorigin` 属性注入到生成的 `<script>` 和 `<link>` 标签中：

```javascript
module.exports = {
    output: {
        crossOriginLoading: 'anonymous'
    }
};
```

## Options

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `inject` | boolean | `false` | 设为 `true` 则使用 HtmlWebpackPlugin 默认注入行为 |
| `htmlDir` | string | `''` | HTML 模板目录路径 |
| `templateParameters` | object | `{}` | 额外的模板参数，会合并到模板变量中 |

## 模板支持

- **EJS**（默认支持）
- **Handlebars**

### EJS 模板示例

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Webpack App</title>
    <% assets.css.forEach(function(file){ %>
      <%= file %>
    <% }); %>
  </head>
  <body>
    <div id='root'></div>
    <% assets.js.forEach(function(file){ %>
      <%= file %>
    <% }); %>
  </body>
</html>
```

### Handlebars 模板示例

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Webpack App</title>
  {{#each assets.css}}
    {{{this}}}
  {{/each}}
</head>
<body>
  <div id='root'></div>
  {{#each assets.js}}
    {{{this}}}
  {{/each}}
</body>
</html>
```

## Inline 模式

将资源直接内联注入 HTML，支持对 `node_modules` 中的包进行 inline：

```javascript
module.exports = {
    entry: {
        app: './src/app.js',
        tracker: 'some-package/tracker.js?__inline'
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/html/page.hbs',
            filename: './dist/html/page.html',
            xhtml: true,
            chunks: ['app'],
        }),
        new InjectHtmlWebpackPlugin()
    ]
};
```

模板中使用：

```html
<head>
  {{{inline.tracker}}}
  {{#each assets.css}}
    {{{this}}}
  {{/each}}
</head>
```

> **注意：** inline 模式直接读取文件内容注入，不会经过 webpack 编译。建议仅对 `node_modules` 中的包使用。

## 模板变量

当 `inject: false`（默认）时，模板中可用的变量：

```javascript
{
    assets: {
        js: ['<script src="..." crossorigin="anonymous"></script>', ...],
        css: ['<link href="..." rel="stylesheet" crossorigin="anonymous"/>', ...],
        manifest: undefined,
        favicon: undefined
    },
    inline: {
        tracker: '<script>...inline content...</script>'
    },
    // ...custom templateParameters
}
```

## 迁移指南 (v1.x → v2.0)

1. 升级 Node.js 至 >= 18.0.0
2. 升级 webpack 至 >= 5.0.0
3. 单独安装 `html-webpack-plugin@^5.0.0`（现在是 peerDependency）
4. 插件 API 无变化，直接替换即可

## License

ISC
