import { readFile } from 'fs/promises';
import { basename, join } from 'path';
import { reset, warning, yellow } from './util';

export interface Configuration {
    name: string;
    commands: {
        extends: string;
        section: string;
        yield: string;
        include: string;
    },
    paths: {
        build: string;
        commands: string;
        public: string;
        src: string;
        pages: string;
        templates: string;
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
            extends: config?.commands?.extends ?? 'EXTENDS',
            section: config?.commands?.section ?? 'SECTION',
            yield: config?.commands?.yield ?? 'YIELD',
            include: config?.commands?.include ?? 'INCLUDE'
        },
        paths: {
            build: config?.paths?.build ?? 'build',
            commands: config?.paths?.commands ?? 'commands',
            public: config?.paths?.public ?? 'public',
            src: config?.paths?.src ?? 'src',
            pages: config?.paths?.pages ?? '$src$/pages',
            templates: config?.paths?.templates ?? '$src$/templates'
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
            extends: config.commands.extends,
            section: config.commands.section,
            yield: config.commands.yield,
            include: config.commands.include
        },
        paths: {
            build: join(root, config.paths.build.replace('$src$', config.paths.src)),
            commands: join(root, config.paths.commands.replace('$src$', config.paths.src)),
            public: join(root, config.paths.public.replace('$src$', config.paths.src)),
            src: join(root, config.paths.src),
            pages: join(root, config.paths.pages.replace('$src$', config.paths.src)),
            templates: join(root, config.paths.templates.replace('$src$', config.paths.src))
        },
        watch: {
            port: config.watch.port,
            wsPort: config.watch.wsPort ?? config.watch.port + 1,
            open: config.watch.open
        }
    };

}