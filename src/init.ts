import { createInterface } from 'readline';
import { mkdir, writeFile, copyFile } from 'fs/promises';
import { basename, join } from 'path';
import { dim, error, magenta, reset, success } from './util';
import { existsSync as exists } from 'fs';

const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query: string): Promise<string> {
    return new Promise(res=>{
        rl.question(` ${query} `, res);
    });
}

async function choice<T extends string>(query: string, options: T[]): Promise<T> {

    while(true){

        let option = await question(`${query} ${dim}(${options.join(', ')})${reset}`);

        if(options.includes(option as T))
            return option as T;

        error('Invalid option!');

    }

}

async function prompt(query: string){
    let option = await choice(query, ['y', 'n']);
    return option == 'y';
}

async function copySample(path: string, root: string){
    await copyFile(join(__dirname, '..', '..', 'sample', path), join(root, path));
}

export default async function init(){

    let root = process.cwd();

    console.log();

    let name;
    if(await prompt('Create new directory?')){
        do{

            name = await question('Name:');

            const NPM_REGEX = /^(?:(?:@(?:[a-z0-9-*~][a-z0-9-*._~]*)?\/[a-z0-9-._~])|[a-z0-9-~])[a-z0-9-._~]*$/;

            if(
                exists(join(root, name)) ||
                !NPM_REGEX.test(name) ||
                name.length > 214 ||
                name.length < 1
            ){
                error('Invalid name!');
                name = null;
            }

        }while(!name);
    }

    console.log();

    let script = await choice('Script:', ['js', 'ts']);
    let style = await choice('Style:', ['css', 'scss']);

    if(name) root = join(root, name);

    for(let dir of ['build', 'public', 'commands', 'src/pages', 'src/templates', `src/${script}`, `src/${style}`])
        await mkdir(join(root, dir), { recursive: true });

    await writeFile(join(root, '.gitignore'), 'node_modules');
    await copySample(`commands/eval.${script}`, root);
    await copySample(`commands/title.${script}`, root);
    await copySample('public/favicon.ico', root);
    await copySample('src/pages/index.html', root);
    await copySample('src/templates/main.html', root);
    await copySample(`src/${script}/script.${script}`, root);
    await copySample(`src/${style}/style.${style}`, root);
    await writeFile(join(root, 'lithor.json'), JSON.stringify({
        $schema: 'https://unpkg.com/lithor/assets/schema.json',
        name: basename(root)
    }, null, 4));

    if(script == 'ts')
        await copySample('tsconfig.json', root);

    success(`Your ${magenta}lithor${reset} project is ready!`);
    
}