#!/usr/bin/env node

import init from './src/init';
import build from './src/build';
import watch from './src/watch';
import { blue, dim, magenta, red, reset, underscore, yellow } from './src/util';

(async ()=>{

    console.log(`${magenta}lithor${reset} ${dim}v${require('./../package.json').version}${reset}`);

    switch(process.argv[2]){
        case 'init': await init(); break;
        case 'build': await build(); break;
        case 'watch': await watch(); break;
        case 'help': help(true); break;
        case 'about': about(); break;
        default: help(false); break;
    }

    console.log();
    process.exit();

})();

function help(fromHelp: boolean){

    console.log(`
  ${fromHelp ? `${blue}Need help?` : `${red}Unknown command!`}${reset} Available commands:
  ${yellow}lithor${reset} init  ${dim}- Create a lithor project${reset}
  ${yellow}lithor${reset} build ${dim}- Generate static files${reset}
  ${yellow}lithor${reset} watch ${dim}- Run the development server${reset}
  ${yellow}lithor${reset} help  ${dim}- Learn the available commands${reset}
  ${yellow}lithor${reset} about ${dim}- Know more about lithor${reset}`);

}

function about(){

    console.log(`
    ,-----.       ██╗     ██╗████████╗██╗  ██╗ ██████╗ ██████╗ 
   /  /|   \\      ██║     ██║╚══██╔══╝██║  ██║██╔═══██╗██╔══██╗
  /  /_|__  \\     ██║     ██║   ██║   ███████║██║   ██║██████╔╝
  \\    | /  /     ██║     ██║   ██║   ██╔══██║██║   ██║██╔══██╗
   \\   |/  /      ███████╗██║   ██║   ██║  ██║╚██████╔╝██║  ██║
    \`-----'       ╚══════╝╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝

                    Made with love by ${magenta}Axónio${reset}
                       ${dim}${underscore}https://axonio.eu${reset}`);

}