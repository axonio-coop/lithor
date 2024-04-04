import { cp, lstat, mkdir, readFile, readdir, rm, writeFile } from 'fs/promises';
import loadConfig, { Configuration } from './config';
import { basename, extname, join, sep } from 'path';
import { minify } from 'html-minifier';
import compile from './compile';
import { dim, error, filterConflicts, info, red, reset, success, warning, yellow } from './util';
import { flattenDiagnosticMessageText, transpileModule } from 'typescript';
import { Context } from '..';

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

            if(file.endsWith('.tmp.js')) return false;

            // allowed extensions
            if(!['.js', '.ts'].includes(extname(file))){
                warning(`${yellow}${file}${reset} isn't in a valid file type.`)
                return false;
            }

            // reserved names
            if(Object.values(config.commands).includes(getCommandName(file))){
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
                let command;

                if(ext == '.js'){
                    let path = join(config.paths.commands, file);
                    delete require.cache[require.resolve(path)];
                    command = require(path);
                }
                
                if(ext == '.ts'){

                    // transpile ts into js

                    let { outputText, diagnostics } = transpileModule(await readFile(join(config.paths.commands, file), 'utf-8'), {});

                    for(let diagnostic of diagnostics ?? []){
                        error(flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
                    }

                    // save and load as js
                    
                    let path = join(config.paths.commands, `${basename(file, ext)}.tmp.js`);
                    await writeFile(path, outputText);
                    delete require.cache[require.resolve(path)];
                    command = require(path).default;

                }

                if(typeof command == 'function')
                    commands[name] = command;
                
            }catch(err: any){ error(`Couldn\'t import ${red}${file}${reset}!\n    ${err}`) }
        }

        info(`${Object.keys(commands).length} command${Object.keys(commands).length == 1 ? '' : 's'} loaded. ${stopwatch(time)}`, false);
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
    html = await render(html, undefined, config, relativePath);
    
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

const COMMENT_REGEX = /<!-- #([A-Z0-9_]+)(?:: ((?:.|\r|\n)*?))? -->/g;

function cmdRegex(command: string){
    return command
        .toUpperCase()
        .replace(/[^A-Z0-9_]/g, '')
        .replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
}

async function render(html: string, data: any, config: Configuration, file: string): Promise<string> {

    // execute commands

    let promises: Promise<string>[] = [];
    html.replace(COMMENT_REGEX, str=>{
        promises.push(execute(str, data, config, file));
        return str;
    });
    let results = await Promise.all(promises);

    html = html.replace(COMMENT_REGEX, ()=>results.shift()!);

    // extends / section

    let extendsRegex = new RegExp(`<!-- #${cmdRegex(config.commands.extends)}: (.+?) -->`);
    let mother = extendsRegex.exec(html)?.[1];
    if(mother){

        html = html.replace(extendsRegex, '');
        
        // get mother

        let motherHtml = await getTemplate(mother, config);

        // find sections

        let sections: { [name: string]: string } = {};

        let sectionCmd = cmdRegex(config.commands.section);
        for(let section of html.split(new RegExp(`(?=<!-- #${sectionCmd}: .+? -->)`, 'g')).slice(1)){
            let name = new RegExp(`<!-- #${sectionCmd}: (.+?) -->`).exec(section)![1];
            let content = section.replace(new RegExp(`<!-- #${sectionCmd}: .+? -->`), '');
            sections[name] = content;
        }

        // yield sections

        let yieldCmd = cmdRegex(config.commands.yield);

        // generic yield
        motherHtml = motherHtml.replace(new RegExp(`<!-- #${yieldCmd} -->`, 'g'), html)

        // specific yield
        motherHtml = motherHtml.replace(
            new RegExp(`<!-- #${yieldCmd}: (.+?) -->`, 'g'),
            (_, section) => sections[section] ?? ''
        );

        return motherHtml;
    }

    return html;
}

async function execute(comment: string, data: any, config: Configuration, file: string){

    let [, command, args ] = COMMENT_REGEX.exec(comment)!;
    COMMENT_REGEX.lastIndex = 0;

    if(command == config.commands.include)
        return await getTemplate(args, config) ?? comment;

    if(Object.values(config.commands).includes(command))
        return comment;

    if(!(command in commands)){
        warning(`${yellow}${command}${reset} is not a known command.`);
        return comment;
    }

    try{

        let result = commands[command](args, { config, data });

        if(result instanceof Promise)
            result = await result;
        
        return result;

    }catch(err: any){
        error(`${red}${command}${reset} ${dim}${file}${reset}\n  ${err}`, false);
        return comment;
    }
    
}

async function getTemplate(args: string, config: Configuration){

    let [, template, data ] = /^(.+?)(?: (.+))?$/.exec(args)!;
    template += '.html';

    let path = join(config.paths.templates, template);
    let html = await readFile(path, 'utf-8');
    return await render(html, eval?.(`"use strict";(${data})`), config, template);
}

function stopwatch(last: number, now?: number){
    
    if(!now) now = Date.now();
    
    let diff = now - last;
    diff /= 1e3;

    return `${dim}(${diff.toFixed(3)}s)${reset}`;
}