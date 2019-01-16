const { existsSync, readdirSync } = require('fs');
const { join, extname, basename, dirname } = require('path');
const assert = require('assert');
const isPlainObject = require('is-plain-object');
const deasyncPromise = require('deasync-promise');
const inquirer = require('inquirer');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const semver = require('semver');

module.exports = function (api, options = {}) {
  const { log, paths } = api;

  const umiVersion = process.env.UMI_VERSION;
  assert(
    semver.gte(umiVersion, '2.4.3') && semver.lt(umiVersion, '3'),
    `Your umi version is ${umiVersion}, >=2.4.3 and <3 is required.`,
  );
  assert(
    !options.entry || isPlainObject(options.entry),
    `options.entry should be object, but got ${JSON.stringify(options.entry)}`,
  );
  assert(
    !options.htmlName || typeof htmlName === 'string',
    `options.htmlName should be string, but got ${JSON.stringify(options.htmlName)}`,
  );
  assert(
    !options.splitChunks || typeof options.splitChunks === 'boolean' || isPlainObject(options.splitChunks),
    `options.splitChunks should be Boolean or Object, but got ${JSON.stringify(options.splitChunks)}`,
  );
  assert(
    !options.html || isPlainObject(options.html),
    `options.html should be Object, but got ${JSON.stringify(options.html)}`,
  );
  assert(
    !options.selectEntry || typeof options.selectEntry === 'boolean' || isPlainObject(options.selectEntry),
    `options.selectEntry should be Boolean or Object, but got ${JSON.stringify(options.selectEntry)}`,
  );

  log.warn(`
[umi-plugin-mpa] 使用 mpa 插件，意味着我们只使用 umi 作为构建工具。所以：

    1. 路由相关功能不工作
    2. global.css、global.js 无效
    3. app.js 无效
    4. 不支持 runtimePublicPath
  `.trim());
  console.log();

  // don't generate html files
  process.env.HTML = 'none';
  // don't add route middleware
  process.env.ROUTE_MIDDLEWARE = 'none';

  const isDev = process.env.NODE_ENV === 'development';

  // 提供一个假的 routes 配置，这样就不会走约定式路由，解析 src/pages 目录
  api.modifyDefaultConfig(memo => {
    return { ...memo, routes: [] };
  });

  api.modifyWebpackConfig(webpackConfig => {
    // set entry
    const hmrScript = webpackConfig.entry['umi'][0];
    webpackConfig.entry = options.entry;
    if (!webpackConfig.entry) {
      // find entry from pages directory
      log.info(`[umi-plugin-mpa] options.entry is null, find files in pages for entry`);
      webpackConfig.entry = readdirSync(paths.absPagesPath)
        .filter(f => f.charAt(0) !== '.' && /\.(j|t)sx?$/.test(extname(f)))
        .reduce((memo, f) => {
          const name = basename(f, extname(f));
          memo[name] = [
            join(paths.absPagesPath, f),
          ];
          return memo;
        }, {});
    }

    // 支持选择部分 entry 以提升开发效率
    if (isDev && options.selectEntry) {
      const keys = Object.keys(webpackConfig.entry);
      if (keys.length > 1) {
        const selectedKeys = deasyncPromise(inquirer.prompt([
          {
            type: 'checkbox',
            message: 'Please select your entry pages',
            name: 'pages',
            choices: keys.map(v => ({
              name: v,
            })),
            validate: (v) => {
              return v.length >= 1 || 'Please choose at least one';
            },
            pageSize: 18,
            ...(isPlainObject(options.selectEntry) ? options.selectEntry : {}),
          }
        ]));
        keys.forEach(key => {
          if (!selectedKeys.pages.includes(key)) {
            delete webpackConfig.entry[key];
          }
        });
      }
    }

    Object.keys(webpackConfig.entry).forEach(key => {
      const entry = webpackConfig.entry[key];

      // modify entry
      webpackConfig.entry[key] = [
        // polyfill
        ...(process.env.BABEL_POLYFILL === 'none' ? [] : [`${__dirname}/templates/polyfill.js`]),
        // hmr
        ...(
          isDev && hmrScript.includes('webpackHotDevClient.js')
            ? [hmrScript]
            : []
        ),
        // original entry
        ...(Array.isArray(entry) ? entry : [entry]),
      ];

      // html-webpack-plugin
      if (options.html) {
        const template = require.resolve('./templates/document.ejs');
        const config = {
          template,
          filename: `${key}.html`,
          chunks: options.splitChunks === true ? ['vendors', key] : [key],
          ...options.html,
        };
        // 约定 entry 同名的 .ejs 文件为模板文档
        // 优先级最高
        const entryFile = Array.isArray(entry) ? entry[0] : entry;
        const templateFile = dirname(entryFile) + '/' + basename(entryFile, extname(entryFile)) + '.ejs';
        if (existsSync(templateFile)) {
          config.template = templateFile;
        }
        // 支持在 chunks 里用 <%= page %> 占位
        if (config.chunks) {
          config.chunks.forEach((chunk, i) => {
            if (chunk === '<%= page %>') {
              config.chunks[i] = key;
            }
          })
        }
        webpackConfig.plugins.push(
          new HTMLWebpackPlugin(config),
        );
      }
    });

    if (isDev && options.html) {
      let filename = 'index.html';
      if (Object.keys(webpackConfig.entry).includes('index')) {
        filename = '__index.html';
        const port = process.env.PORT || '8000';
        log.warn(`Since we already have index.html, checkout http://localhost:${port}/${filename} for entry list.`);
      }
      webpackConfig.plugins.push(
        new HTMLWebpackPlugin({
          template: require.resolve('./templates/entryList.ejs'),
          entries: Object.keys(webpackConfig.entry),
          filename,
          inject: false,
        }),
      );
    }

    return webpackConfig;
  });

  api.chainWebpackConfig(webpackConfig => {
    webpackConfig.module.rule('html')
      .test(/\.html?$/)
      .use('file-loader')
      .loader('file-loader')
      .options({
        name: options.htmlName || '[name].[ext]',
      });

    webpackConfig.output
      .chunkFilename(`[name].js`);

    if (options.splitChunks) {
      webpackConfig.optimization
        .splitChunks(
          isPlainObject(options.splitChunks)
            ? options.splitChunks
            : {
              chunks: 'all',
              name: 'vendors',
              minChunks: 2,
            }
        );
    }
  });

  api.modifyAFWebpackOpts(opts => {
    opts.urlLoaderExcludes = [
      ...(opts.urlLoaderExcludes || []),
      /\.html?$/,
      /\.ejs?$/,
    ];
    return opts;
  });
}
