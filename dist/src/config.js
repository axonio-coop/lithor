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
function loadConfig() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2;
    return __awaiter(this, void 0, void 0, function* () {
        let root = process.cwd();
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
            name: (_a = config === null || config === void 0 ? void 0 : config.name) !== null && _a !== void 0 ? _a : (0, path_1.basename)(root),
            commands: {
                extends: (_c = (_b = config === null || config === void 0 ? void 0 : config.commands) === null || _b === void 0 ? void 0 : _b.extends) !== null && _c !== void 0 ? _c : 'EXTENDS',
                section: (_e = (_d = config === null || config === void 0 ? void 0 : config.commands) === null || _d === void 0 ? void 0 : _d.section) !== null && _e !== void 0 ? _e : 'SECTION',
                yield: (_g = (_f = config === null || config === void 0 ? void 0 : config.commands) === null || _f === void 0 ? void 0 : _f.yield) !== null && _g !== void 0 ? _g : 'YIELD',
                include: (_j = (_h = config === null || config === void 0 ? void 0 : config.commands) === null || _h === void 0 ? void 0 : _h.include) !== null && _j !== void 0 ? _j : 'INCLUDE'
            },
            paths: {
                build: (_l = (_k = config === null || config === void 0 ? void 0 : config.path) === null || _k === void 0 ? void 0 : _k.build) !== null && _l !== void 0 ? _l : './build',
                commands: (_o = (_m = config === null || config === void 0 ? void 0 : config.path) === null || _m === void 0 ? void 0 : _m.commands) !== null && _o !== void 0 ? _o : './commands',
                public: (_q = (_p = config === null || config === void 0 ? void 0 : config.path) === null || _p === void 0 ? void 0 : _p.public) !== null && _q !== void 0 ? _q : './public',
                src: (_s = (_r = config === null || config === void 0 ? void 0 : config.path) === null || _r === void 0 ? void 0 : _r.src) !== null && _s !== void 0 ? _s : './src',
                pages: (_u = (_t = config === null || config === void 0 ? void 0 : config.path) === null || _t === void 0 ? void 0 : _t.pages) !== null && _u !== void 0 ? _u : '$src$/pages',
                templates: (_w = (_v = config === null || config === void 0 ? void 0 : config.path) === null || _v === void 0 ? void 0 : _v.templates) !== null && _w !== void 0 ? _w : '$src$/templates'
            },
            watch: {
                port: (_y = (_x = config === null || config === void 0 ? void 0 : config.watch) === null || _x === void 0 ? void 0 : _x.port) !== null && _y !== void 0 ? _y : 8080,
                wsPort: (_z = config === null || config === void 0 ? void 0 : config.watch) === null || _z === void 0 ? void 0 : _z.wsPort,
                open: (_1 = (_0 = config === null || config === void 0 ? void 0 : config.watch) === null || _0 === void 0 ? void 0 : _0.open) !== null && _1 !== void 0 ? _1 : true
            }
        };
        return {
            name: config.name,
            commands: {
                extends: config.commands.extends,
                section: config.commands.section,
                yield: config.commands.yield,
                include: config.commands.include
            },
            paths: {
                build: (0, path_1.join)(root, config.paths.build.replace('$src$', config.paths.src)),
                commands: (0, path_1.join)(root, config.paths.commands.replace('$src$', config.paths.src)),
                public: (0, path_1.join)(root, config.paths.public.replace('$src$', config.paths.src)),
                src: (0, path_1.join)(root, config.paths.src),
                pages: (0, path_1.join)(root, config.paths.pages.replace('$src$', config.paths.src)),
                templates: (0, path_1.join)(root, config.paths.templates.replace('$src$', config.paths.src)),
            },
            watch: {
                port: config.watch.port,
                wsPort: (_2 = config.watch.wsPort) !== null && _2 !== void 0 ? _2 : config.watch.port + 1,
                open: config.watch.open
            }
        };
    });
}
exports.default = loadConfig;
