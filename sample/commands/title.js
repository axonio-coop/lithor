
export default function(args, ctx){

    if(ctx.data?.title){
        return `${ctx.data.title} · ${ctx.config.name}`;
    }else{
        return ctx.config.name;
    }

}