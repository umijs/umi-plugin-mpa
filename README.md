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
* ✔︎ 通过 `splitChunks` 提取公共部分

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

## LICENSE

MIT
