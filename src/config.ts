import { readFile } from 'fs/promises';
import { basename, join } from 'path';
import { reset, warning, yellow } from './util';

export interface Configuration {
    name: string;
    commands: {
        title: {
            name: string;
            template: (title: string) => string;
        },
        content: string;
    },
    paths: {
        build: string;
        commands: string;
        public: string;
        src: string;
        pages: string;
        templates: string;
        main: string;
    }
    watch: {
        port: number;
        wsPort: number;
        open: boolean;
    }
}

let warned = false;

export default async function loadConfig(): Promise<Configuration> {

    let root = process.cwd();
    let config: any;

    try{

        let json = await readFile(join(root, 'lithor.json'), 'utf-8');
        config = JSON.parse(json);

    }catch(e){
        // in case loadConfig() is called multiple times.
        if(!warned){
            warning(`Couldn't load ${yellow}lithor.json${reset}!`)
            warned = true;
        }
    }

    config = {
        name: config?.name ?? basename(root),
        commands: {
            title: {
                name: config?.commands?.title?.name ?? 'TITLE',
                template: config?.commands?.title?.template ?? '$title$ · $name$'
            },
            content: config?.commands?.content ?? 'CONTENT'
        },
        paths: {
            build: config?.path?.build ?? './build',
            commands: config?.path?.commands ?? './commands',
            public: config?.path?.public ?? './public',
            src: config?.path?.src ?? './src',
            pages: config?.path?.pages ?? '$src$/pages',
            templates: config?.path?.templates ?? '$src$/templates',
            main: config?.path?.main ?? '$src$/main.html'
        },
        watch: {
            port: config?.watch?.port ?? 8080,
            wsPort: config?.watch?.wsPort,
            open: config?.watch?.open ?? true
        }
    }

    return {
        name: config.name,
        commands: {
            title: {
                name: config.commands.title.name.toUpperCase(),
                template: (title: string)=>title == ''
                    ? config.name
                    : config.commands.title.template
                        .replace('$title$', title)
                        .replace('$name$', config.name)
            },
            content: config.commands.content
        },
        paths: {
            build: join(root, config.paths.build.replace('$src$', config.paths.src)),
            commands: join(root, config.paths.commands.replace('$src$', config.paths.src)),
            public: join(root, config.paths.public.replace('$src$', config.paths.src)),
            src: join(root, config.paths.src),
            pages: join(root, config.paths.pages.replace('$src$', config.paths.src)),
            templates: join(root, config.paths.templates.replace('$src$', config.paths.src)),
            main: join(root, config.paths.main.replace('$src$', config.paths.src))
        },
        watch: {
            port: config.watch.port,
            wsPort: config.watch.wsPort ?? config.watch.port + 1,
            open: config.watch.open
        }
    };

}