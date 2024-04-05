import { existsSync as exists } from 'fs';
import { Configuration } from './config';
import { dirname, join } from 'path';
import { readFile, readdir, writeFile, mkdir } from 'fs/promises';
import { error, isDirectory, filterConflicts, info } from './util';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import sass from 'sass';
import CleanCSS from 'clean-css';
import { ProvidePlugin, webpack } from 'webpack';

export default async function(config: Configuration, isProd: boolean){
    await Promise.all([
        compileJS(config, isProd),
        compileCSS(config, isProd)
    ]);
}

async function findFiles(src: string, path: string){

    let fullPath = join(src, path);

    if(!exists(fullPath)) return [];

    let res: string[] = [];

    for(let item of await readdir(fullPath)){

        if(await isDirectory(join(fullPath, item)))
            res.push(...await findFiles(src, join(path, item)));
        else
            res.push(join(path, item));

    }

    return res;
}

function getDestination(src: string){
    return src
        .replace(/^ts/, 'js')
        .replace(/\.ts$/, '.js')
        .replace(/^scss/, 'css')
        .replace(/\.scss$/, '.css');
}

async function compileJS(config: Configuration, isProd: boolean){

    let files = [
        ...await findFiles(config.paths.src, 'js'),
        ...await findFiles(config.paths.src, 'ts')
    ];

    files = filterConflicts(files, getDestination);

    let entry: any = {};
    for(let file of files){
        entry[getDestination(file)] = join(config.paths.src, file);
    }

    await (new Promise<void>(res=>{

        webpack({
            mode: isProd ? 'production' : 'development',
            entry,
            output: {
                path: config.paths.build,
                filename: '[name]'
            },
            module: { rules: [
                { test: /\.(js|ts)$/, use: 'babel-loader' },
                { test: /\.ts$/, use: 'ts-loader' }
            ] },
            plugins: [ new ProvidePlugin({ process: 'process/browser' }) ],
            resolve: { fallback: {
                assert: require.resolve('assert'),
                buffer: require.resolve('buffer'),
                console: require.resolve('console-browserify'),
                constants: require.resolve('constants-browserify'),
                crypto: require.resolve('crypto-browserify'),
                domain: require.resolve('domain-browser'),
                events: require.resolve('events'),
                fs: false,
                http: require.resolve('stream-http'),
                https: require.resolve('https-browserify'),
                os: require.resolve('os-browserify/browser'),
                path: require.resolve('path-browserify'),
                punycode: require.resolve('punycode'),
                process: require.resolve('process/browser'),
                querystring: require.resolve('querystring-es3'),
                stream: require.resolve('stream-browserify'),
                string_decoder: require.resolve('string_decoder'),
                sys: require.resolve('util'),
                timers: require.resolve('timers-browserify'),
                tty: require.resolve('tty-browserify'),
                url: require.resolve('url'),
                util: require.resolve('util'),
                vm: require.resolve('vm-browserify'),
                zlib: require.resolve('browserify-zlib'),
            } }
        }, (err, stats)=>{

            if(err)
                error(err.message);

            for(let err of stats?.compilation.errors ?? [])
                error(err.message);

            res();
        });

    }));

    info('  JavaScript compiled.', false);

}

async function compileCSS(config: Configuration, isProd: boolean){

    let files = [
        ...await findFiles(config.paths.src, 'css'),
        ...await findFiles(config.paths.src, 'scss')
    ];

    files = filterConflicts(files, getDestination);

    for(let file of files){

        let css = await readFile(join(config.paths.src, file), 'utf-8');

        try{
            
            // compile scss
            if(file.endsWith('.scss'))
                css = sass.compileString(css).css;

            // autoprefixer
            css = (await postcss([ autoprefixer ]).process(css, {
                from: file,
                to: getDestination(file)
            })).css;

            // minify
            if(isProd)
                css = new CleanCSS().minify(css).styles;

            // save
            let path = join(config.paths.build, getDestination(file));
            await mkdir(dirname(path), { recursive: true });
            await writeFile(path, css);

            info(`    ${file} compiled.`, false);

        }catch(e: any){
            error(e);
        }

    }

    info(`  CSS compiled.`, false);
    
}