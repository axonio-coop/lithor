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
const promises_1 = require("fs/promises");
const config_1 = __importDefault(require("./config"));
const path_1 = require("path");
const html_minifier_1 = require("html-minifier");
const compile_1 = __importDefault(require("./compile"));
const util_1 = require("./util");
const typescript_1 = require("typescript");
const marked_1 = require("marked");
let commands = {};
function default_1(isProd) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            (0, util_1.info)('Building...');
            let buildStart = Date.now();
            let config = yield (0, config_1.default)();
            (0, util_1.info)(`Configutation loaded. ${stopwatch(buildStart)}`, false);
            let time = Date.now();
            let files = yield (0, promises_1.readdir)(config.paths.commands);
            files = files.filter(file => {
                if (file.endsWith('.tmp.js'))
                    return false;
                if (!['.js', '.ts'].includes((0, path_1.extname)(file))) {
                    (0, util_1.warning)(`${util_1.yellow}${file}${util_1.reset} isn't in a valid file type.`);
                    return false;
                }
                if (Object.values(config.commands).includes(getCommandName(file))) {
                    (0, util_1.warning)(`${util_1.yellow}${name}${util_1.reset} is a reserved command name.`);
                    return false;
                }
                return true;
            });
            files = (0, util_1.filterConflicts)(files, getCommandName);
            for (let file of files) {
                try {
                    let name = getCommandName(file);
                    let ext = (0, path_1.extname)(file);
                    let command;
                    if (ext == '.js') {
                        let path = (0, path_1.join)(config.paths.commands, file);
                        delete require.cache[require.resolve(path)];
                        command = require(path);
                    }
                    if (ext == '.ts') {
                        let { outputText, diagnostics } = (0, typescript_1.transpileModule)(yield (0, promises_1.readFile)((0, path_1.join)(config.paths.commands, file), 'utf-8'), {});
                        for (let diagnostic of diagnostics !== null && diagnostics !== void 0 ? diagnostics : []) {
                            (0, util_1.error)((0, typescript_1.flattenDiagnosticMessageText)(diagnostic.messageText, '\n'));
                        }
                        let path = (0, path_1.join)(config.paths.commands, `${(0, path_1.basename)(file, ext)}.tmp.js`);
                        yield (0, promises_1.writeFile)(path, outputText);
                        delete require.cache[require.resolve(path)];
                        command = require(path).default;
                    }
                    if (typeof command == 'function')
                        commands[name] = command;
                }
                catch (err) {
                    (0, util_1.error)(`Couldn\'t import ${util_1.red}${file}${util_1.reset}!\n    ${err}`);
                }
            }
            (0, util_1.info)(`${Object.keys(commands).length} command${Object.keys(commands).length == 1 ? '' : 's'} loaded. ${stopwatch(time)}`, false);
            time = Date.now();
            yield (0, promises_1.rm)(config.paths.build, { recursive: true, force: true });
            yield (0, promises_1.mkdir)(config.paths.build);
            (0, util_1.info)(`Build directory reset. ${stopwatch(time)}`, false);
            time = Date.now();
            yield buildPage('', config, isProd);
            (0, util_1.info)(`All pages built. ${stopwatch(time)}`, false);
            time = Date.now();
            yield (0, compile_1.default)(config, isProd);
            (0, util_1.info)(`Scripts and styles compiled. ${stopwatch(time)}`, false);
            time = Date.now();
            yield (0, promises_1.cp)(config.paths.public, config.paths.build, { recursive: true });
            (0, util_1.info)(`Public items copied. ${stopwatch(time)}`, false);
            (0, util_1.success)(`Done! ${stopwatch(buildStart)}`, false);
        }
        catch (err) {
            (0, util_1.error)(`Failed to build: ${err}`);
        }
    });
}
exports.default = default_1;
function getCommandName(command) {
    return (0, path_1.basename)(command, (0, path_1.extname)(command)).toUpperCase();
}
function buildPage(relativePath, config, isProd) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let fullPath = (0, path_1.join)(config.paths.pages, relativePath);
        if ((yield (0, promises_1.lstat)(fullPath)).isDirectory()) {
            for (let page of yield (0, promises_1.readdir)(fullPath))
                yield buildPage((0, path_1.join)(relativePath, page), config, isProd);
            return;
        }
        let html = yield (0, promises_1.readFile)(fullPath, 'utf-8');
        if (fullPath.endsWith('.md'))
            html = (0, marked_1.parse)(html);
        html = yield render(html, undefined, config, relativePath);
        let parents = relativePath.split(path_1.sep);
        let name = parents.pop();
        if (name != 'index.html')
            parents.push((0, path_1.basename)(name, (0, path_1.extname)(name)));
        yield (0, promises_1.mkdir)((0, path_1.join)(config.paths.build, ...parents), { recursive: true });
        yield (0, promises_1.writeFile)((0, path_1.join)(config.paths.build, ...parents, 'index.html'), isProd
            ? (0, html_minifier_1.minify)(html, {
                collapseBooleanAttributes: true,
                collapseInlineTagWhitespace: true,
                collapseWhitespace: true,
                removeComments: true
            })
            : html);
        (0, util_1.info)(`  ${(_a = parents[parents.length - 1]) !== null && _a !== void 0 ? _a : 'Root page'} built.`, false);
    });
}
const COMMENT_REGEX = /<!-- #([A-Z0-9_]+)(?:: ((?:.|\r|\n)*?))? -->/g;
function cmdRegex(command) {
    return command
        .toUpperCase()
        .replace(/[^A-Z0-9_]/g, '')
        .replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
}
function render(html, data, config, file) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let promises = [];
        html.replace(COMMENT_REGEX, str => {
            promises.push(execute(str, data, config, file));
            return str;
        });
        let results = yield Promise.all(promises);
        html = html.replace(COMMENT_REGEX, () => results.shift());
        let extendsRegex = new RegExp(`<!-- #${cmdRegex(config.commands.extends)}: (.+?) -->`);
        let mother = (_a = extendsRegex.exec(html)) === null || _a === void 0 ? void 0 : _a[1];
        if (mother) {
            html = html.replace(extendsRegex, '');
            let motherHtml = yield getTemplate(mother, config);
            let sections = {};
            let sectionCmd = cmdRegex(config.commands.section);
            for (let section of html.split(new RegExp(`(?=<!-- #${sectionCmd}: .+? -->)`, 'g')).slice(1)) {
                let name = new RegExp(`<!-- #${sectionCmd}: (.+?) -->`).exec(section)[1];
                let content = section.replace(new RegExp(`<!-- #${sectionCmd}: .+? -->`), '');
                sections[name] = content;
            }
            let yieldCmd = cmdRegex(config.commands.yield);
            motherHtml = motherHtml.replace(new RegExp(`<!-- #${yieldCmd} -->`, 'g'), html);
            motherHtml = motherHtml.replace(new RegExp(`<!-- #${yieldCmd}: (.+?) -->`, 'g'), (_, section) => { var _a; return (_a = sections[section]) !== null && _a !== void 0 ? _a : ''; });
            return motherHtml;
        }
        return html;
    });
}
function execute(comment, data, config, file) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let [, command, args] = COMMENT_REGEX.exec(comment);
        COMMENT_REGEX.lastIndex = 0;
        if (command == config.commands.include)
            return (_a = yield getTemplate(args, config)) !== null && _a !== void 0 ? _a : comment;
        if (Object.values(config.commands).includes(command))
            return comment;
        if (!(command in commands)) {
            (0, util_1.warning)(`${util_1.yellow}${command}${util_1.reset} is not a known command.`);
            return comment;
        }
        try {
            let result = commands[command](args, { config, data });
            if (result instanceof Promise)
                result = yield result;
            return result;
        }
        catch (err) {
            (0, util_1.error)(`${util_1.red}${command}${util_1.reset} ${util_1.dim}${file}${util_1.reset}\n  ${err}`, false);
            return comment;
        }
    });
}
function getTemplate(args, config) {
    return __awaiter(this, void 0, void 0, function* () {
        let [, template, data] = /^(.+?)(?: (.+))?$/.exec(args);
        template += '.html';
        let path = (0, path_1.join)(config.paths.templates, template);
        let html = yield (0, promises_1.readFile)(path, 'utf-8');
        return yield render(html, eval === null || eval === void 0 ? void 0 : eval(`"use strict";(${data})`), config, template);
    });
}
function stopwatch(last, now) {
    if (!now)
        now = Date.now();
    let diff = now - last;
    diff /= 1e3;
    return `${util_1.dim}(${diff.toFixed(3)}s)${util_1.reset}`;
}
