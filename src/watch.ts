import express, { NextFunction, Request, Response } from 'express';
import loadConfig, { Configuration } from './config';
import { join } from 'path';
import { existsSync as exists } from 'fs';
import { error, isDirectory, open } from './util';
import { readFile } from 'fs/promises';
import { WebSocket, WebSocketServer } from 'ws';
import build from './build';
import { watch } from 'chokidar';

export default function(){ return new Promise(async ()=>{
    
    let config = await loadConfig();
    
    // --- http server ---

    const app = express();
    app.use(inject(config));
    app.use(express.static(config.paths.build));

    app.get('/lithor-live.js', async (req, res)=>{
        res.send(
            (await readFile(join(__dirname, '..', '..', 'assets', 'watch-ws.js'), 'utf-8'))
                .replace('$WS_PORT$', config.watch.wsPort.toString())
        );
    });

    app.listen(config.watch.port, ()=>{
        if(config.watch.open)
            open(`http://localhost:${config.watch.port}/`);
    });
    
    // --- ws server ---

    const wss = new WebSocketServer({ port: config.watch.wsPort });

    wss.on('connection', ws=>{
        (ws as any).isAlive = true;
        ws.on('pong', ()=>(ws as any).isAlive = true);
    });

    let aliveCheck = setInterval(()=>{
        for(let ws of wss.clients){

            if(!(ws as any).isAlive)
                return ws.terminate();

            (ws as any).isAlive = false;
            ws.ping();

        }
    }, 5e3);

    wss.on('close', ()=>clearInterval(aliveCheck));

    // --- file watch ---

    let watcher = watch([
        config.paths.commands,
        config.paths.main,
        config.paths.pages,
        config.paths.public,
        config.paths.src,
    ], {
        ignored: file=>file.endsWith('.lithor.js'),
        ignoreInitial: true
    });

    async function handleChange(){

        try{

            await build();

            for(let ws of wss.clients){
                if(ws.readyState === WebSocket.OPEN)
                    ws.send('refresh');
            }

        }catch(e: any){
            error(e);
        }

    }

    watcher
        .on('change', handleChange)
        .on('add', handleChange)
        .on('unlink', handleChange)
        .on('addDir', handleChange)
        .on('unlinkDir', handleChange);

    await build();

}) }

function inject(config: Configuration){
    return async function(req: Request, res: Response, next: NextFunction){

        let path = join(config.paths.build, req.path);

        if(!exists(path))
            return next();
        
        if(await isDirectory(path))
            path = join(path, 'index.html');

        if(!path.endsWith('.html'))
            return next();

        let html = await readFile(path, 'utf-8');
        res.send(html + '<script src="/lithor-live.js"></script>');

    }
}