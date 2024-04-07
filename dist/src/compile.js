"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const promises_1 = require("fs/promises");
const util_1 = require("./util");
const postcss_1 = __importDefault(require("postcss"));
const autoprefixer_1 = __importDefault(require("autoprefixer"));
const sass_1 = __importDefault(require("sass"));
const clean_css_1 = __importDefault(require("clean-css"));
const webpack_1 = require("webpack");
function default_1(config, isProd) {
    return __awaiter(this, void 0, void 0, function* () {
        yield Promise.all([
            compileJS(config, isProd),
            compileCSS(config, isProd)
        ]);
    });
}
exports.default = default_1;
function findFiles(src, path) {
    return __awaiter(this, void 0, void 0, function* () {
        let fullPath = (0, path_1.join)(src, path);
        if (!(0, fs_1.existsSync)(fullPath))
            return [];
        let res = [];
        for (let item of yield (0, promises_1.readdir)(fullPath)) {
            if (yield (0, util_1.isDirectory)((0, path_1.join)(fullPath, item)))
                res.push(...yield findFiles(src, (0, path_1.join)(path, item)));
            else
                res.push((0, path_1.join)(path, item));
        }
        return res;
    });
}
function getDestination(src) {
    return src
        .replace(/^ts/, 'js')
        .replace(/\.ts$/, '.js')
        .replace(/^scss/, 'css')
        .replace(/\.scss$/, '.css');
}
function compileJS(config, isProd) {
    return __awaiter(this, void 0, void 0, function* () {
        let files = [
            ...yield findFiles(config.paths.src, 'js'),
            ...yield findFiles(config.paths.src, 'ts')
        ];
        files = (0, util_1.filterConflicts)(files, getDestination);
        let entry = {};
        for (let file of files) {
            entry[getDestination(file)] = (0, path_1.join)(config.paths.src, file);
        }
        yield (new Promise(res => {
            (0, webpack_1.webpack)({
                mode: isProd ? 'production' : 'development',
                entry,
                output: {
                    path: config.paths.build,
                    filename: '[name]'
                },
                module: { rules: [
                        { test: /\.(js|ts)$/, use: 'babel-loader' },
                        { test: /\.ts$/, use: 'ts-loader' }
                    ] },
                plugins: [new webpack_1.ProvidePlugin({ process: 'process/browser' })],
                resolve: { fallback: {
                        assert: require.resolve('assert'),
                        buffer: require.resolve('buffer'),
                        console: require.resolve('console-browserify'),
                        constants: require.resolve('constants-browserify'),
                        crypto: require.resolve('crypto-browserify'),
                        domain: require.resolve('domain-browser'),
                        events: require.resolve('events'),
                        fs: false,
                        http: require.resolve('stream-http'),
                        https: require.resolve('https-browserify'),
                        os: require.resolve('os-browserify/browser'),
                        path: require.resolve('path-browserify'),
                        punycode: require.resolve('punycode'),
                        process: require.resolve('process/browser'),
                        querystring: require.resolve('querystring-es3'),
                        stream: require.resolve('stream-browserify'),
                        string_decoder: require.resolve('string_decoder'),
                        sys: require.resolve('util'),
                        timers: require.resolve('timers-browserify'),
                        tty: require.resolve('tty-browserify'),
                        url: require.resolve('url'),
                        util: require.resolve('util'),
                        vm: require.resolve('vm-browserify'),
                        zlib: require.resolve('browserify-zlib'),
                    } }
            }, (err, stats) => {
                var _a;
                if (err)
                    (0, util_1.error)(err.message);
                for (let err of (_a = stats === null || stats === void 0 ? void 0 : stats.compilation.errors) !== null && _a !== void 0 ? _a : [])
                    (0, util_1.error)(err.message);
                res();
            });
        }));
        (0, util_1.info)('  JavaScript compiled.', false);
    });
}
function compileCSS(config, isProd) {
    return __awaiter(this, void 0, void 0, function* () {
        let files = [
            ...yield findFiles(config.paths.src, 'css'),
            ...yield findFiles(config.paths.src, 'scss')
        ];
        files = (0, util_1.filterConflicts)(files, getDestination);
        for (let file of files) {
            let css = yield (0, promises_1.readFile)((0, path_1.join)(config.paths.src, file), 'utf-8');
            try {
                if (file.endsWith('.scss')) {
                    let loadPaths = [(0, path_1.dirname)((0, path_1.join)(config.paths.src, file))];
                    let node_modules = yield findNodeModules(loadPaths[0]);
                    if (node_modules)
                        loadPaths.push(node_modules);
                    css = sass_1.default.compileString(css, { loadPaths }).css;
                }
                css = (yield (0, postcss_1.default)([autoprefixer_1.default]).process(css, {
                    from: file,
                    to: getDestination(file)
                })).css;
                if (isProd)
                    css = new clean_css_1.default().minify(css).styles;
                let path = (0, path_1.join)(config.paths.build, getDestination(file));
                yield (0, promises_1.mkdir)((0, path_1.dirname)(path), { recursive: true });
                yield (0, promises_1.writeFile)(path, css);
                (0, util_1.info)(`    ${file} compiled.`, false);
            }
            catch (e) {
                (0, util_1.error)(e);
            }
        }
        (0, util_1.info)(`  CSS compiled.`, false);
    });
}
function findNodeModules(path) {
    return __awaiter(this, void 0, void 0, function* () {
        let { root } = (0, path_1.parse)(path);
        do {
            let nm = (0, path_1.join)(path, 'node_modules');
            if ((0, fs_1.existsSync)(nm) &&
                (yield (0, util_1.isDirectory)(nm)))
                return nm;
            path = (0, path_1.join)(path, '..');
        } while (path != root);
        return null;
    });
}
