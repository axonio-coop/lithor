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
exports.filterConflicts = exports.open = exports.isDirectory = exports.error = exports.warning = exports.info = exports.success = exports.bgGray = exports.bgWhite = exports.bgCyan = exports.bgMagenta = exports.bgBlue = exports.bgYellow = exports.bgGreen = exports.bgRed = exports.bgBlack = exports.gray = exports.white = exports.cyan = exports.magenta = exports.blue = exports.yellow = exports.green = exports.red = exports.black = exports.hidden = exports.reverse = exports.blink = exports.underscore = exports.dim = exports.bright = exports.reset = void 0;
const child_process_1 = require("child_process");
const promises_1 = require("fs/promises");
exports.reset = '\x1b[0m';
exports.bright = '\x1b[1m';
exports.dim = '\x1b[2m';
exports.underscore = '\x1b[4m';
exports.blink = '\x1b[5m';
exports.reverse = '\x1b[7m';
exports.hidden = '\x1b[8m';
exports.black = '\x1b[30m';
exports.red = '\x1b[31m';
exports.green = '\x1b[32m';
exports.yellow = '\x1b[33m';
exports.blue = '\x1b[34m';
exports.magenta = '\x1b[35m';
exports.cyan = '\x1b[36m';
exports.white = '\x1b[37m';
exports.gray = '\x1b[90m';
exports.bgBlack = '\x1b[40m';
exports.bgRed = '\x1b[41m';
exports.bgGreen = '\x1b[42m';
exports.bgYellow = '\x1b[43m';
exports.bgBlue = '\x1b[44m';
exports.bgMagenta = '\x1b[45m';
exports.bgCyan = '\x1b[46m';
exports.bgWhite = '\x1b[47m';
exports.bgGray = '\x1b[100m';
function log(text, color, message, newLine) {
    console.log(`${newLine ? '\n' : ''} ${color} ${text} ${exports.reset} ${message}`);
}
function success(message, newLine = true) {
    log('SUCCESS', exports.bgGreen, message, newLine);
}
exports.success = success;
function info(message, newLine = true) {
    log('INFO', exports.bgBlue, message, newLine);
}
exports.info = info;
function warning(message, newLine = true) {
    log('WARNING', exports.bgYellow, message, newLine);
}
exports.warning = warning;
function error(message, newLine = true) {
    log('ERROR', exports.bgRed, message, newLine);
}
exports.error = error;
function isDirectory(path) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield (0, promises_1.lstat)(path)).isDirectory();
    });
}
exports.isDirectory = isDirectory;
function open(url) {
    switch (process.platform) {
        case 'darwin':
            (0, child_process_1.spawn)('open', [url]);
            break;
        case 'linux':
            (0, child_process_1.spawn)('xdg-open', [url]);
            break;
        case 'win32':
            (0, child_process_1.spawn)('explorer.exe', [url]);
            break;
        default:
            warning(`Unsupported platform ${exports.yellow}${process.platform}${exports.reset}!\n - Report this issue: ${exports.underscore}${exports.dim}https://github.com/axonio-coop/lithor/issues${exports.reset}\n - Open this URL manually: ${exports.underscore}${exports.dim}${url}${exports.reset}`);
            break;
    }
}
exports.open = open;
function filterConflicts(arr, transform) {
    let newArr = [];
    let transformedArr = [];
    for (let str of arr) {
        let transformed = transform(str);
        let i = transformedArr.indexOf(transformed);
        if (i != -1) {
            warning(`${exports.yellow}${str}${exports.reset} conflicts with ${exports.yellow}${transformedArr[i]}${exports.reset}!`);
            continue;
        }
        newArr.push(str);
        transformedArr.push(transformed);
    }
    return newArr;
}
exports.filterConflicts = filterConflicts;
