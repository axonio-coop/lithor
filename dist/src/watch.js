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
const express_1 = __importDefault(require("express"));
const config_1 = __importDefault(require("./config"));
const path_1 = require("path");
const fs_1 = require("fs");
const util_1 = require("./util");
const promises_1 = require("fs/promises");
const ws_1 = require("ws");
const build_1 = __importDefault(require("./build"));
const chokidar_1 = require("chokidar");
function default_1() {
    return new Promise(() => __awaiter(this, void 0, void 0, function* () {
        let config = yield (0, config_1.default)();
        const app = (0, express_1.default)();
        app.use(inject(config));
        app.use(express_1.default.static(config.paths.build));
        app.get('/lithor-live.js', (req, res) => __awaiter(this, void 0, void 0, function* () {
            res.send((yield (0, promises_1.readFile)((0, path_1.join)(__dirname, '..', '..', 'assets', 'watch-ws.js'), 'utf-8'))
                .replace('$WS_PORT$', config.watch.wsPort.toString()));
        }));
        let serverReady = new Promise(res => {
            app.listen(config.watch.port, () => res());
        });
        const wss = new ws_1.WebSocketServer({ port: config.watch.wsPort });
        wss.on('connection', ws => {
            ws.isAlive = true;
            ws.on('pong', () => ws.isAlive = true);
        });
        let aliveCheck = setInterval(() => {
            for (let ws of wss.clients) {
                if (!ws.isAlive)
                    return ws.terminate();
                ws.isAlive = false;
                ws.ping();
            }
        }, 5e3);
        wss.on('close', () => clearInterval(aliveCheck));
        let watcher = (0, chokidar_1.watch)([
            config.paths.commands,
            config.paths.main,
            config.paths.pages,
            config.paths.public,
            config.paths.src,
        ], {
            ignored: file => file.endsWith('.lithor.js'),
            ignoreInitial: true
        });
        function handleChange() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield (0, build_1.default)(false);
                    for (let ws of wss.clients) {
                        if (ws.readyState === ws_1.WebSocket.OPEN)
                            ws.send('refresh');
                    }
                }
                catch (e) {
                    (0, util_1.error)(e);
                }
            });
        }
        watcher
            .on('change', handleChange)
            .on('add', handleChange)
            .on('unlink', handleChange)
            .on('addDir', handleChange)
            .on('unlinkDir', handleChange);
        yield (0, build_1.default)(false);
        yield serverReady;
        if (config.watch.open)
            (0, util_1.open)(`http://localhost:${config.watch.port}/`);
    }));
}
exports.default = default_1;
function inject(config) {
    return function (req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let path = (0, path_1.join)(config.paths.build, req.path);
            if (!(0, fs_1.existsSync)(path))
                return next();
            if (yield (0, util_1.isDirectory)(path))
                path = (0, path_1.join)(path, 'index.html');
            if (!path.endsWith('.html'))
                return next();
            let html = yield (0, promises_1.readFile)(path, 'utf-8');
            res.send(html + '<script src="/lithor-live.js"></script>');
        });
    };
}
