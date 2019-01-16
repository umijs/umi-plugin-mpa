# umi-plugin-mpa

MPA(multiple-page application) plugin for umi.

[![NPM version](https://img.shields.io/npm/v/umi-plugin-mpa.svg?style=flat)](https://npmjs.org/package/umi-plugin-mpa)
[![Build Status](https://img.shields.io/travis/umijs/umi-plugin-mpa.svg?style=flat)](https://travis-ci.org/umijs/umi-plugin-mpa)
[![NPM downloads](http://img.shields.io/npm/dm/umi-plugin-mpa.svg?style=flat)](https://npmjs.org/package/umi-plugin-mpa)

## Why

有一些基于 [atool-build](https://github.com/ant-tool/atool-build) 或者 [roadhog](https://github.com/sorrycc/roadhog) 的老业务，是传统的 MPA（多页应用），并且他们是真的多页，因为每个页面之间的关系不大，强行套 SPA（单页应用）的模式意义并不大，反而多了一些冗余的代码，比如路由。

另外，atool-build 已停止维护。

所以，为了让这些老业务能更容易地升级上来，享受新的技术栈，我们提供了 umi-plugin-mpa 来支持多页应用，把 umi 单纯作为 webpack 封装工具来使用。同时，umi 的部分功能会不可用，比如路由、global.js、global.css、app.js 等。

## Features

* ✔︎ 禁用 umi 内置的 HTML 生成
* ✔︎ 禁用 umi 内置的路由功能
* ✔︎ 禁用 umi 默认生成的 entry 配置
* ✔︎ 支持通过 targets 配置的补丁方案
* ✔︎ 支持自动查找 src/pages 下的 js 文件为 entry
* ✔︎ import 的 html 文件会被生成到 dist 目录下
* ✔︎ Hot Module Replacement
* ✔︎ 通过 `splitChunks` 配置提取公共部分
* ✔︎ 通过 `html` 配置根据入口文件自动生成 html
* ✔︎ 通过 `selectEntry` 配置选择部分 entry 以提升调试效率

## Installation

```bash
$ yarn add umi-plugin-mpa
```

## Usage

Config it in `.umirc.js` or `config/config.js`,

```js
export default {
  plugins: ['umi-plugin-mpa'],
};
```

with options,

```js
export default {
  plugins: [
    ['umi-plugin-mpa', options],
  ],
};
```

## Options

### entry

指定 webpack 的 entry 。

* Type: `Object`
* Default: null

如果没有设置 entry，会自动查找 `src/pages` 下的 js 或 ts 文件为 entry 。 

### htmlName

指定 import 生成的 html 文件的文件名。

* Type: `String`
* Default: `[name].[ext]`

可以用 `[name]`、`[path]`、`[hash]` 和 `[ext]`，详见 https://github.com/webpack-contrib/file-loader 。

### splitChunks

配置 webpack 的 splitChunks，用于提取 common 或 vendors 等。

* Type: `Boolean | Object`
* Default: false

如果值为 `true`，等于配置了 `{ chunks: 'async', name: 'vendors' }`，详见 https://webpack.js.org/plugins/split-chunks-plugin/ 。

### html

配置给 [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin) 的配置，用于为每个 entry 自动生成 html 文件。

* Type: `Object`
* Default: `null`

如有配置，则会基于以下默认值进行覆盖，

```js
{
  template,
  filename: `${page}.html`,
  chunks: [page]
}
```

其中，

* template 有一个[默认模板](http://github.com/umijs/umi-plugin-mpa/tree/master/templates/document.ejs)，可通过配置进行覆盖
* 如果有一个和 entry 文件同目录同文件名但后缀为 `.ejs` 的文件，则会用次文件作为其 template，且优先级最高
* chunks 有一个特殊项为 `<%= page %>`，如果配置了，会被替换为当前 page 名

更多配置方式，详见 https://github.com/jantimon/html-webpack-plugin#options 。

### selectEntry

是否开启 entry 选择，以提升开发效率。

* Type: `Boolean`
* Default: `false`

注：

1. 适用于 entry 量大的项目，只在 dev 时开启
2. 由于使用了 deasync-promise，所以在入口选择界面上按 Ctrl+C 退出会失败，且进程清理不干净。这时需手动强制退出相关 node 进程。

## LICENSE

MIT
