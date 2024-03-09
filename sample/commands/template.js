const { readFile } = require('fs/promises');
const { join } = require('path');

module.exports = async function(template, ctx){
    let path = join(ctx.config.paths.templates, template + '.html');
    let html = await readFile(path, 'utf-8');
    let { content } = await ctx.render(html);
    return content;
}