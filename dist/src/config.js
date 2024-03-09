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
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const path_1 = require("path");
const util_1 = require("./util");
let warned = false;
function loadConfig(root) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5;
    return __awaiter(this, void 0, void 0, function* () {
        if (!root)
            root = process.cwd();
        let config;
        try {
            let json = yield (0, promises_1.readFile)((0, path_1.join)(root, 'lithor.json'), 'utf-8');
            config = JSON.parse(json);
        }
        catch (e) {
            if (!warned) {
                (0, util_1.warning)(`Couldn't load ${util_1.yellow}lithor.json${util_1.reset}!`);
                warned = true;
            }
        }
        config = {
            mode: (_a = config === null || config === void 0 ? void 0 : config.mode) !== null && _a !== void 0 ? _a : 'prod',
            name: (_b = config === null || config === void 0 ? void 0 : config.name) !== null && _b !== void 0 ? _b : (0, path_1.basename)(root),
            commands: {
                title: {
                    name: (_e = (_d = (_c = config === null || config === void 0 ? void 0 : config.commands) === null || _c === void 0 ? void 0 : _c.title) === null || _d === void 0 ? void 0 : _d.name) !== null && _e !== void 0 ? _e : 'TITLE',
                    template: (_h = (_g = (_f = config === null || config === void 0 ? void 0 : config.commands) === null || _f === void 0 ? void 0 : _f.title) === null || _g === void 0 ? void 0 : _g.template) !== null && _h !== void 0 ? _h : '$title$ · $name$'
                },
                content: (_k = (_j = config === null || config === void 0 ? void 0 : config.commands) === null || _j === void 0 ? void 0 : _j.content) !== null && _k !== void 0 ? _k : 'CONTENT'
            },
            paths: {
                build: (_m = (_l = config === null || config === void 0 ? void 0 : config.path) === null || _l === void 0 ? void 0 : _l.build) !== null && _m !== void 0 ? _m : './build',
                commands: (_p = (_o = config === null || config === void 0 ? void 0 : config.path) === null || _o === void 0 ? void 0 : _o.commands) !== null && _p !== void 0 ? _p : './commands',
                public: (_r = (_q = config === null || config === void 0 ? void 0 : config.path) === null || _q === void 0 ? void 0 : _q.public) !== null && _r !== void 0 ? _r : './public',
                src: (_t = (_s = config === null || config === void 0 ? void 0 : config.path) === null || _s === void 0 ? void 0 : _s.src) !== null && _t !== void 0 ? _t : './src',
                pages: (_v = (_u = config === null || config === void 0 ? void 0 : config.path) === null || _u === void 0 ? void 0 : _u.pages) !== null && _v !== void 0 ? _v : '$src$/pages',
                templates: (_x = (_w = config === null || config === void 0 ? void 0 : config.path) === null || _w === void 0 ? void 0 : _w.templates) !== null && _x !== void 0 ? _x : '$src$/templates',
                main: (_z = (_y = config === null || config === void 0 ? void 0 : config.path) === null || _y === void 0 ? void 0 : _y.main) !== null && _z !== void 0 ? _z : '$src$/main.html'
            },
            watch: {
                port: (_1 = (_0 = config === null || config === void 0 ? void 0 : config.watch) === null || _0 === void 0 ? void 0 : _0.port) !== null && _1 !== void 0 ? _1 : 8080,
                wsPort: (_2 = config === null || config === void 0 ? void 0 : config.watch) === null || _2 === void 0 ? void 0 : _2.wsPort,
                open: (_4 = (_3 = config === null || config === void 0 ? void 0 : config.watch) === null || _3 === void 0 ? void 0 : _3.open) !== null && _4 !== void 0 ? _4 : true
            }
        };
        return {
            mode: config.mode,
            name: config.name,
            commands: {
                title: {
                    name: config.commands.title.name.toUpperCase(),
                    template: (title) => title == ''
                        ? config.name
                        : config.commands.title.template
                            .replace('$title$', title)
                            .replace('$name$', config.name)
                },
                content: config.commands.content
            },
            paths: {
                build: (0, path_1.join)(root, config.paths.build.replace('$src$', config.paths.src)),
                commands: (0, path_1.join)(root, config.paths.commands.replace('$src$', config.paths.src)),
                public: (0, path_1.join)(root, config.paths.public.replace('$src$', config.paths.src)),
                src: (0, path_1.join)(root, config.paths.src),
                pages: (0, path_1.join)(root, config.paths.pages.replace('$src$', config.paths.src)),
                templates: (0, path_1.join)(root, config.paths.templates.replace('$src$', config.paths.src)),
                main: (0, path_1.join)(root, config.paths.main.replace('$src$', config.paths.src))
            },
            watch: {
                port: config.watch.port,
                wsPort: (_5 = config.watch.wsPort) !== null && _5 !== void 0 ? _5 : config.watch.port + 1,
                open: config.watch.open
            }
        };
    });
}
exports.default = loadConfig;
