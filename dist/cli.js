#!/usr/bin/env node
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
const init_1 = __importDefault(require("./src/init"));
const build_1 = __importDefault(require("./src/build"));
const watch_1 = __importDefault(require("./src/watch"));
const util_1 = require("./src/util");
(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`${util_1.magenta}lithor${util_1.reset} ${util_1.dim}v${require('./../package.json').version}${util_1.reset}`);
    switch (process.argv[2]) {
        case 'init':
            yield (0, init_1.default)();
            break;
        case 'build':
            yield (0, build_1.default)(true);
            break;
        case 'watch':
            yield (0, watch_1.default)();
            break;
        case 'help':
            help(true);
            break;
        case 'about':
            about();
            break;
        default:
            help(false);
            break;
    }
    console.log();
    process.exit();
}))();
function help(fromHelp) {
    console.log(`
  ${fromHelp ? `${util_1.blue}Need help?` : `${util_1.red}Unknown command!`}${util_1.reset} Available commands:
  ${util_1.yellow}lithor${util_1.reset} init  ${util_1.dim}- Create a lithor project${util_1.reset}
  ${util_1.yellow}lithor${util_1.reset} build ${util_1.dim}- Generate static files${util_1.reset}
  ${util_1.yellow}lithor${util_1.reset} watch ${util_1.dim}- Run the development server${util_1.reset}
  ${util_1.yellow}lithor${util_1.reset} help  ${util_1.dim}- Learn the available commands${util_1.reset}
  ${util_1.yellow}lithor${util_1.reset} about ${util_1.dim}- Know more about lithor${util_1.reset}`);
}
function about() {
    console.log(`
    ,-----.       ██╗     ██╗████████╗██╗  ██╗ ██████╗ ██████╗ 
   /  /|   \\      ██║     ██║╚══██╔══╝██║  ██║██╔═══██╗██╔══██╗
  /  /_|__  \\     ██║     ██║   ██║   ███████║██║   ██║██████╔╝
  \\    | /  /     ██║     ██║   ██║   ██╔══██║██║   ██║██╔══██╗
   \\   |/  /      ███████╗██║   ██║   ██║  ██║╚██████╔╝██║  ██║
    \`-----'       ╚══════╝╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝

                    Made with love by ${util_1.magenta}Axónio${util_1.reset}
                           ${util_1.dim}${util_1.underscore}axonio.pt${util_1.reset}`);
}
