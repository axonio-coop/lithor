import { readFile } from 'fs/promises';
import { join } from 'path';
import { Context } from 'lithor';

export default async function(template: string, ctx: Context){
    let path = join(ctx.config.paths.templates, template + '.html');
    let html = await readFile(path, 'utf-8');
    let { content } = await ctx.render(html);
    return content;
}