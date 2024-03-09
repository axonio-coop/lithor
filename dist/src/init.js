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
const readline_1 = require("readline");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const build_1 = __importDefault(require("./build"));
const util_1 = require("./util");
const fs_1 = require("fs");
const rl = (0, readline_1.createInterface)({
    input: process.stdin,
    output: process.stdout
});
function question(query) {
    return new Promise(res => {
        rl.question(` ${query} `, res);
    });
}
function choice(query, options) {
    return __awaiter(this, void 0, void 0, function* () {
        while (true) {
            let option = yield question(`${query} ${util_1.dim}(${options.join(', ')})${util_1.reset}`);
            if (options.includes(option))
                return option;
            (0, util_1.error)('Invalid option!');
        }
    });
}
function prompt(query) {
    return __awaiter(this, void 0, void 0, function* () {
        let option = yield choice(query, ['y', 'n']);
        return option == 'y';
    });
}
function copySample(path, root) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, promises_1.copyFile)((0, path_1.join)(__dirname, '..', '..', 'sample', path), (0, path_1.join)(root, path));
    });
}
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        let root = process.cwd();
        console.log();
        let name;
        if (yield prompt('Create new directory?')) {
            do {
                name = yield question('Name:');
                const NPM_REGEX = /^(?:(?:@(?:[a-z0-9-*~][a-z0-9-*._~]*)?\/[a-z0-9-._~])|[a-z0-9-~])[a-z0-9-._~]*$/;
                if ((0, fs_1.existsSync)((0, path_1.join)(root, name)) ||
                    !NPM_REGEX.test(name) ||
                    name.length > 214 ||
                    name.length < 1) {
                    (0, util_1.error)('Invalid name!');
                    name = null;
                }
            } while (!name);
        }
        console.log();
        let script = yield choice('Script:', ['js', 'ts']);
        let style = yield choice('Style:', ['css', 'scss']);
        if (name)
            root = (0, path_1.join)(root, name);
        for (let dir of ['build', 'public', 'commands', 'src/pages', 'src/templates', `src/${script}`, `src/${style}`])
            yield (0, promises_1.mkdir)((0, path_1.join)(root, dir), { recursive: true });
        yield (0, promises_1.writeFile)((0, path_1.join)(root, '.gitignore'), 'node_modules');
        yield copySample(`commands/template.${script}`, root);
        yield copySample(`commands/eval.${script}`, root);
        yield copySample('public/favicon.ico', root);
        yield copySample('src/pages/index.html', root);
        yield copySample('src/main.html', root);
        yield (0, promises_1.writeFile)((0, path_1.join)(root, 'lithor.json'), JSON.stringify({
            $schema: 'https://unpkg.com/lithor/assets/schema.json',
            mode: 'dev',
            name: (0, path_1.basename)(root)
        }, null, 4));
        if (script == 'ts')
            yield copySample('tsconfig.json', root);
        yield (0, build_1.default)(root);
        (0, util_1.success)(`Your ${util_1.magenta}lithor${util_1.reset} project is ready!`);
    });
}
exports.default = init;
