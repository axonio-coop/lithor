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
let main = '';
let commands = {};
function default_1(root) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, util_1.info)('Building...');
        let buildStart = Date.now();
        if (!root)
            root = process.cwd();
        let config = yield (0, config_1.default)(root);
        (0, util_1.info)(`Configutation loaded. ${stopwatch(buildStart)}`, false);
        let time = Date.now();
        let files = yield (0, promises_1.readdir)(config.paths.commands);
        files = files.filter(file => {
            if (file.endsWith('.lithor.js'))
                return false;
            if (!['.js', '.ts'].includes((0, path_1.extname)(file))) {
                (0, util_1.warning)(`${util_1.yellow}${file}${util_1.reset} isn't in a valid file type.`);
                return false;
            }
            if ([
                config.commands.title.name,
                config.commands.content,
            ].includes(getCommandName(file))) {
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
                if (ext == '.js') {
                    let path = (0, path_1.join)(config.paths.commands, file);
                    delete require.cache[require.resolve(path)];
                    commands[name] = require(path);
                }
                if (ext == '.ts') {
                    let { outputText, diagnostics } = (0, typescript_1.transpileModule)(yield (0, promises_1.readFile)((0, path_1.join)(config.paths.commands, file), 'utf-8'), {});
                    for (let diagnostic of diagnostics !== null && diagnostics !== void 0 ? diagnostics : []) {
                        (0, util_1.error)((0, typescript_1.flattenDiagnosticMessageText)(diagnostic.messageText, '\n'));
                    }
                    let path = (0, path_1.join)(config.paths.commands, `${(0, path_1.basename)(file, ext)}.lithor.js`);
                    yield (0, promises_1.writeFile)(path, outputText);
                    delete require.cache[require.resolve(path)];
                    commands[name] = require(path).default;
                }
            }
            catch (err) {
                (0, util_1.error)(`Couldn\'t import ${util_1.red}${file}${util_1.reset}!\n    ${err}`);
            }
        }
        (0, util_1.info)(`${Object.keys(commands).length} command${Object.keys(commands).length == 1 ? '' : 's'} loaded. ${stopwatch(time)}`, false);
        time = Date.now();
        main = (yield render(yield (0, promises_1.readFile)(config.paths.main, 'utf-8'), config, (0, path_1.basename)(config.paths.main))).content;
        (0, util_1.info)(`Main template loaded. ${stopwatch(time)}`, false);
        time = Date.now();
        yield (0, promises_1.rm)(config.paths.build, { recursive: true, force: true });
        yield (0, promises_1.mkdir)(config.paths.build);
        (0, util_1.info)(`Build directory reset. ${stopwatch(time)}`, false);
        time = Date.now();
        yield buildPage('', config);
        (0, util_1.info)(`All pages built. ${stopwatch(time)}`, false);
        time = Date.now();
        yield (0, compile_1.default)(config);
        (0, util_1.info)(`Scripts and styles compiled. ${stopwatch(time)}`, false);
        time = Date.now();
        yield (0, promises_1.cp)(config.paths.public, config.paths.build, { recursive: true });
        (0, util_1.info)(`Public items copied. ${stopwatch(time)}`, false);
        (0, util_1.success)(`Done! ${stopwatch(buildStart)}`, false);
    });
}
exports.default = default_1;
function getCommandName(command) {
    return (0, path_1.basename)(command, (0, path_1.extname)(command)).toUpperCase();
}
function buildPage(relativePath, config) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let fullPath = (0, path_1.join)(config.paths.pages, relativePath);
        if ((yield (0, promises_1.lstat)(fullPath)).isDirectory()) {
            for (let page of yield (0, promises_1.readdir)(fullPath))
                yield buildPage((0, path_1.join)(relativePath, page), config);
            return;
        }
        let html = yield (0, promises_1.readFile)(fullPath, 'utf-8');
        let { title, content } = yield render(html, config, relativePath);
        html = main
            .replace(`<!-- #${config.commands.title.name} -->`, config.commands.title.template(title))
            .replace(`<!-- #${config.commands.content} -->`, content);
        let parents = relativePath.split(path_1.sep);
        let name = parents.pop();
        if (name != 'index.html')
            parents.push((0, path_1.basename)(name, (0, path_1.extname)(name)));
        yield (0, promises_1.mkdir)((0, path_1.join)(config.paths.build, ...parents), { recursive: true });
        yield (0, promises_1.writeFile)((0, path_1.join)(config.paths.build, ...parents, 'index.html'), config.mode == 'dev'
            ? html
            : (0, html_minifier_1.minify)(html, {
                collapseBooleanAttributes: true,
                collapseInlineTagWhitespace: true,
                collapseWhitespace: true,
                removeComments: true
            }));
        (0, util_1.info)(`  ${(_a = parents[parents.length - 1]) !== null && _a !== void 0 ? _a : 'Root page'} built.`, false);
    });
}
function render(html, config, file) {
    return __awaiter(this, void 0, void 0, function* () {
        const REGEX = /<!-- #[A-Z0-9_]+(: .*?)? -->/g;
        let title = '';
        let promises = [];
        html.replace(REGEX, str => {
            promises.push(execute(str, config, file));
            return str;
        });
        let data = yield Promise.all(promises);
        let content = html.replace(REGEX, () => {
            let { type, content } = data.shift();
            if (type == 'title') {
                title = content;
                return '';
            }
            return content;
        });
        return { title, content };
    });
}
function execute(comment, config, file) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let matches = (_a = comment.match(/<!-- #([A-Z0-9_]+)(: (.*?))? -->/)) !== null && _a !== void 0 ? _a : [];
        let command = matches[1];
        let args = matches[3];
        if (command == config.commands.title.name && args)
            return { type: 'title', content: args };
        if (!(command in commands) ||
            typeof commands[command] != 'function')
            return { type: 'result', content: comment };
        try {
            let result = commands[command](args, {
                config,
                render: (html) => __awaiter(this, void 0, void 0, function* () { return yield render(html, config, file); })
            });
            if (result instanceof Promise)
                result = yield result;
            return { type: 'result', content: result };
        }
        catch (err) {
            (0, util_1.error)(`${util_1.red}${command}${util_1.reset} ${util_1.dim}${file}${util_1.reset}\n  ${err}`, false);
            return { type: 'result', content: comment };
        }
    });
}
function stopwatch(last, now) {
    if (!now)
        now = Date.now();
    let diff = now - last;
    diff /= 1e3;
    return `${util_1.dim}(${diff.toFixed(3)}s)${util_1.reset}`;
}
