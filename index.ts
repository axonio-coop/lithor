import { Configuration } from './src/config';

export interface Context {
    config: Configuration,
    render: (html: string)=>Promise<{ title: string, content: string }>
}