import { spawn } from 'child_process';
import { lstat } from 'fs/promises';

// https://stackoverflow.com/a/41407246

export const reset = '\x1b[0m';
export const bright = '\x1b[1m';
export const dim = '\x1b[2m';
export const underscore = '\x1b[4m';
export const blink = '\x1b[5m';
export const reverse = '\x1b[7m';
export const hidden = '\x1b[8m';

export const black = '\x1b[30m';
export const red = '\x1b[31m';
export const green = '\x1b[32m';
export const yellow = '\x1b[33m';
export const blue = '\x1b[34m';
export const magenta = '\x1b[35m';
export const cyan = '\x1b[36m';
export const white = '\x1b[37m';
export const gray = '\x1b[90m';

export const bgBlack = '\x1b[40m';
export const bgRed = '\x1b[41m';
export const bgGreen = '\x1b[42m';
export const bgYellow = '\x1b[43m';
export const bgBlue = '\x1b[44m';
export const bgMagenta = '\x1b[45m';
export const bgCyan = '\x1b[46m';
export const bgWhite = '\x1b[47m';
export const bgGray = '\x1b[100m';

function log(text: string, color: string, message: string, newLine: boolean){
    console.log(`${newLine ? '\n' : ''} ${color} ${text} ${reset} ${message}`);
}

export function success(message: string, newLine = true){
    log('SUCCESS', bgGreen, message, newLine);
}

export function info(message: string, newLine = true){
    log('INFO', bgBlue, message, newLine);
}

export function warning(message: string, newLine = true){
    log('WARNING', bgYellow, message, newLine);
}

export function error(message: string, newLine = true){
    log('ERROR', bgRed, message, newLine);
}

export async function isDirectory(path: string){
    return (await lstat(path)).isDirectory();
}

export function open(url: string){
    switch(process.platform){
        case 'darwin': spawn('open', [ url ]); break;
        case 'linux': spawn('xdg-open', [ url ]); break;
        case 'win32': spawn('explorer.exe', [ url ]); break;
        default:
            warning(`Unsupported platform ${yellow}${process.platform}${reset}!\n - Report this issue: ${dim}https://github.com/axonio-coop/lithor/issues${reset}\n - Open this URL manually: ${dim}${url}${reset}`);
            break;
    }
}

export function filterConflicts(arr: string[], transform: (str: string)=>string){

    let newArr: string[] = [];
    let transformedArr: string[] = [];

    for(let str of arr){

        let transformed = transform(str);

        let i = transformedArr.indexOf(transformed);
        if(i != -1){
            warning(`${yellow}${str}${reset} conflicts with ${yellow}${transformedArr[i]}${reset}!`);
            continue;
        }

        newArr.push(str);
        transformedArr.push(transformed);

    }

    return newArr;
}