import { cp, lstat, mkdir, readFile, readdir, rm, writeFile } from 'fs/promises';
import loadConfig, { Configuration } from './config';
import { basename, extname, join, sep } from 'path';
import { minify } from 'html-minifier';
import compile from './compile';
import { dim, error, filterConflicts, info, red, reset, success, warning, yellow } from './util';
import { flattenDiagnosticMessageText, transpileModule } from 'typescript';
import { Context } from '..';

let main = '';
let commands: { [command: string]: (args: string, ctx: Context)=>string|Promise<string> } = {};

export default async function(isProd: boolean){
    try{

        info('Building...');
        let buildStart = Date.now();

        // load config
        let config = await loadConfig();

        info(`Configutation loaded. ${stopwatch(buildStart)}`, false);
        let time = Date.now();

        // load commands
        let files = await readdir(config.paths.commands);

        files = files.filter(file=>{

            if(file.endsWith('.lithor.js')) return false;

            // allowed extensions
            if(!['.js', '.ts'].includes(extname(file))){
                warning(`${yellow}${file}${reset} isn't in a valid file type.`)
                return false;
            }

            // reserved names
            if([
                config.commands.title.name,
                config.commands.content,
            ].includes(getCommandName(file))){
                warning(`${yellow}${name}${reset} is a reserved command name.`);
                return false;
            }

            return true;

        })
        
        files = filterConflicts(files, getCommandName)
        
        for(let file of files){
            try{

            let name = getCommandName(file);
            let ext = extname(file);

                if(ext == '.js'){
                    let path = join(config.paths.commands, file);
                    delete require.cache[require.resolve(path)];
                    commands[name] = require(path);
                }
                
                if(ext == '.ts'){

                    // transpile ts into js

                    let { outputText, diagnostics } = transpileModule(await readFile(join(config.paths.commands, file), 'utf-8'), {});

                    for(let diagnostic of diagnostics ?? []){
                        error(flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
                    }

                    // save and load as js
                    
                    let path = join(config.paths.commands, `${basename(file, ext)}.lithor.js`);
                    await writeFile(path, outputText);
                    delete require.cache[require.resolve(path)];
                    commands[name] = require(path).default;

                }
                
            }catch(err: any){ error(`Couldn\'t import ${red}${file}${reset}!\n    ${err}`) }
        }

        info(`${Object.keys(commands).length} command${Object.keys(commands).length == 1 ? '' : 's'} loaded. ${stopwatch(time)}`, false);
        time = Date.now();

        // load main
        main = (await render(await readFile(config.paths.main, 'utf-8'), config, basename(config.paths.main))).content;

        info(`Main template loaded. ${stopwatch(time)}`, false);
        time = Date.now();

        // wipe build dir
        await rm(config.paths.build, { recursive: true, force: true });
        await mkdir(config.paths.build);

        info(`Build directory reset. ${stopwatch(time)}`, false);
        time = Date.now();

        // build pages
        await buildPage('', config, isProd);

        info(`All pages built. ${stopwatch(time)}`, false);
        time = Date.now();

        // compile
        await compile(config, isProd);

        info(`Scripts and styles compiled. ${stopwatch(time)}`, false);
        time = Date.now();

        // copy public to build
        await cp(config.paths.public, config.paths.build, { recursive: true });

        info(`Public items copied. ${stopwatch(time)}`, false);
        success(`Done! ${stopwatch(buildStart)}`, false);
   
    }catch(err){
        error(`Failed to build: ${err}`);
    }
}

function getCommandName(command: string){
    return basename(command, extname(command)).toUpperCase();
}

async function buildPage(relativePath: string, config: Configuration, isProd: boolean){
    
    let fullPath = join(config.paths.pages, relativePath);

    // check if it's a directory
    if((await lstat(fullPath)).isDirectory()){
        for(let page of await readdir(fullPath))
            await buildPage(join(relativePath, page), config, isProd);
        return;
    }

    // get page content
    let html = await readFile(fullPath, 'utf-8');
    let { title, content } = await render(html, config, relativePath);
    html = main
        .replace(`<!-- #${config.commands.title.name} -->`, config.commands.title.template(title))
        .replace(`<!-- #${config.commands.content} -->`, content);
    
    // find where to place
    let parents = relativePath.split(sep);
    let name = parents.pop()!;

    if(name != 'index.html')
        parents.push(basename(name, extname(name)));

    await mkdir(join(config.paths.build, ...parents), { recursive: true });

    await writeFile(
        join(config.paths.build, ...parents, 'index.html'),
        isProd
        ? minify(html, {
            collapseBooleanAttributes: true,
            collapseInlineTagWhitespace: true,
            collapseWhitespace: true,
            removeComments: true
        })
        : html
    )

    info(`  ${parents[parents.length - 1] ?? 'Root page'} built.`, false);

}

interface CommandResult {
    type: 'result'|'title';
    content: string;
}

const COMMENT_REGEX = /<!-- #([A-Z0-9_]+)(: ((.|\r|\n)*?))? -->/g;

async function render(html: string, config: Configuration, file: string){

    let title = '';

    let promises: Promise<CommandResult>[] = [];
    html.replace(COMMENT_REGEX, str=>{
        promises.push(execute(str, config, file));
        return str;
    });
    let data = await Promise.all(promises);

    let content = html.replace(COMMENT_REGEX, ()=>{

        let { type, content } = data.shift()!;

        if(type == 'title'){
            title = content;
            return '';
        }

        return content;
    });

    return { title, content }
}

async function execute(comment: string, config: Configuration, file: string): Promise<CommandResult> {

    let matches = COMMENT_REGEX.exec(comment) ?? [];
    COMMENT_REGEX.lastIndex = 0;

    let command = matches[1];
    let args = matches[3];

    if(command == config.commands.title.name && args)
        return { type: 'title', content: args };

    if(
        !(command in commands) ||
        typeof commands[command] != 'function'
    ) return { type: 'result', content: comment };

    try{

        let result = commands[command](args, {
            config,
            render: async html=>await render(html, config, file)
        });

        if(result instanceof Promise)
            result = await result;
        
        return { type: 'result', content: result };

    }catch(err: any){
        error(`${red}${command}${reset} ${dim}${file}${reset}\n  ${err}`, false);
        return { type: 'result', content: comment };
    }
    
}

function stopwatch(last: number, now?: number){
    
    if(!now) now = Date.now();
    
    let diff = now - last;
    diff /= 1e3;

    return `${dim}(${diff.toFixed(3)}s)${reset}`;
}