import { IApi } from 'umi-plugin-types';
import { existsSync, readdirSync, lstatSync } from 'fs';
import { join, extname, basename, dirname } from 'path';
import { cloneDeep, isPlainObject, flattenDeep } from 'lodash';
import AJV from 'ajv';
import schema from './schema';

const HTMLWebpackPlugin = require('html-webpack-plugin');
const assert = require('assert');
const deasyncPromise = require('deasync-promise');
const inquirer = require('inquirer');
const semver = require('semver');

interface IOption {
  entry?: object,
  htmlName?: string,
  deepPageEntry?: boolean,
  splitChunks?: object | boolean,
  html?: {
    template?: string,
  },
  selectEntry?: boolean | object,
}

interface IEntry {
  [name: string]: string | string[];
}

interface IEntryConfig {
  context?: object,
}

function getFiles(absPath: string, path: string, files: string[]) {
  return files.map(f => {
    const lstat = lstatSync(join(absPath, path, f));
    if(f.charAt(0) !== '.' && !f.startsWith('__') && lstat.isDirectory()) {
      const subDirFiles = readdirSync(join(absPath, path, f));
      return getFiles(absPath, join(path, f), subDirFiles);
    } else {
      return join(path, f);
    }
  })
}

export default function(api: IApi, options = {} as IOption) {
  const { log, paths } = api;

  const umiVersion = process.env.UMI_VERSION;
  assert(
    semver.gte(umiVersion, '2.4.3') && semver.lt(umiVersion, '3.0.0'),
    `Your umi version is ${umiVersion}, >=2.4.3 and <3 is required.`,
  );

  // validate options with ajv
  const ajv = new AJV({ allErrors: true });
  const isValid = ajv.validate(schema, options);
  if (!isValid) {
    const errors = ajv.errors.map(({ dataPath, message }, index) => {
      return `${index + 1}. ${dataPath}${dataPath ? ' ' : ''}${message}`;
    });
    throw new Error(`
Invalid options applied to umi-plugin-mpa

${errors.join('\n')}
`.trim());
  }

  log.warn(
    `
[umi-plugin-mpa] 使用 mpa 插件，意味着我们只使用 umi 作为构建工具。所以：

    1. 路由相关功能不工作
    2. global.css、global.js 无效
    3. app.js 无效
    4. 不支持 runtimePublicPath
    5. ...
  `.trim(),
  );
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

    if (!options.entry) {
      // find entry from pages directory
      log.info(
        `[umi-plugin-mpa] options.entry is null, find files in pages for entry`,
      );
      // 是否进入子目录生成路由
      const allFiles = options.deepPageEntry 
        ? flattenDeep(getFiles(paths.absPagesPath, '', readdirSync(paths.absPagesPath)))
        : readdirSync(paths.absPagesPath);
      webpackConfig.entry = (allFiles as string[])
        .filter(f => basename(f).charAt(0) !== '.' && /\.(j|t)sx?$/.test(extname(f)))
        .reduce((memo, f) => {
          const name = f.replace(/\.(j|t)sx?$/, '');
          memo[name] = [join(paths.absPagesPath, f)];
          return memo;
        }, {});
    } else {
      webpackConfig.entry = options.entry as IEntry;
    }

    // 支持选择部分 entry 以提升开发效率
    if (isDev && options.selectEntry) {
      const keys = Object.keys(webpackConfig.entry);
      if (keys.length > 1) {
        const selectedKeys = deasyncPromise(
          inquirer.prompt([
            Object.assign(
            {
              type: 'checkbox',
              message: 'Please select your entry pages',
              name: 'pages',
              choices: keys.map(v => ({
                name: v,
              })),
              validate: v => {
                return v.length >= 1 || 'Please choose at least one';
              },
              pageSize: 18,
            }, isPlainObject(options.selectEntry)
                ? options.selectEntry
                : {}),
          ]),
        );
        keys.forEach(key => {
          if (!selectedKeys.pages.includes(key)) {
            delete webpackConfig.entry[key];
          }
        });
      }
    }

    Object.keys(webpackConfig.entry).forEach(key => {
      const entry = webpackConfig.entry[key];
      let entryConfig = {} as IEntryConfig;
      if (Array.isArray(entry) && isPlainObject(entry[entry.length - 1])) {
        entryConfig = entry.splice(entry.length - 1, 1)[0];
      }

      // modify entry
      webpackConfig.entry[key] = [
        // polyfill
        ...(process.env.BABEL_POLYFILL === 'none'
          ? []
          : [require.resolve(`../templates/polyfill.js`)]),
        // hmr
        ...(isDev && hmrScript.includes('webpackHotDevClient.js')
          ? [hmrScript]
          : []),
        // original entry
        ...(Array.isArray(entry) ? entry : [entry]),
      ];

      // html-webpack-plugin
      if (options.html) {
        const template = require.resolve('../templates/document.ejs');
        const config = {
          template,
          filename: `${key}.html`,
          chunks: options.splitChunks === true ? ['vendors', key] : [key],
          ...cloneDeep(options.html),
          ...entryConfig.context,
        };
        // 约定 entry 同名的 .ejs 文件为模板文档
        // 优先级最高
        const entryFile = Array.isArray(entry) ? entry[0] : entry;
        const templateFile =
          dirname(entryFile) +
          '/' +
          basename(entryFile, extname(entryFile)) +
          '.ejs';
        if (existsSync(templateFile)) {
          config.template = templateFile;
        }
        // 支持在 chunks 里用 <%= page %> 占位
        if (config.chunks) {
          for (const [i, chunk] of config.chunks.entries()) {
            if (chunk === '<%= page %>') {
              config.chunks[i] = key;
            }
          }
        }
        webpackConfig.plugins.push(new HTMLWebpackPlugin(config));
      }
    });

    if (isDev && options.html) {
      let filename = 'index.html';
      if (Object.keys(webpackConfig.entry).includes('index')) {
        filename = '__index.html';
        const port = process.env.PORT || '8000';
        log.warn(
          `Since we already have index.html, checkout http://localhost:${port}/${filename} for entry list.`,
        );
      }
      webpackConfig.plugins.push(
        new HTMLWebpackPlugin({
          template: require.resolve('../templates/entryList.ejs'),
          entries: Object.keys(webpackConfig.entry),
          filename,
          inject: false,
        }),
      );
    }

    // remove all the default aliases which umi-plugin-dev set
    // @see https://github.com/umijs/umi/blob/f74a7dcc3e6ee7cc4e685a0d47db8d37849cb0e0/packages/umi-build-dev/src/plugins/afwebpack-config.js#L67
    ['react', 'react-dom', 'react-router', 'react-router-dom', 'react-router-config', 'history'].forEach(lib => {
      delete webpackConfig.resolve.alias[lib];
    });

    return webpackConfig;
  });

  api.chainWebpackConfig(webpackConfig => {
    webpackConfig.module
      .rule('html')
      .test(/\.html?$/)
      .use('file-loader')
      .loader('file-loader')
      .options({
        name: options.htmlName || '[name].[ext]',
      });

    webpackConfig.output.chunkFilename(`[name].js`);

    if (options.splitChunks) {
      webpackConfig.optimization.splitChunks(
        isPlainObject(options.splitChunks)
          ? options.splitChunks
          : {
              chunks: 'all',
              name: 'vendors',
              minChunks: 2,
            },
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
};
