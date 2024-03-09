export interface Configuration {
    mode: 'dev' | 'prod';
    name: string;
    commands: {
        title: {
            name: string;
            template: (title: string) => string;
        };
        content: string;
    };
    paths: {
        build: string;
        commands: string;
        public: string;
        src: string;
        pages: string;
        templates: string;
        main: string;
    };
    watch: {
        port: number;
        wsPort: number;
        open: boolean;
    };
}
export default function loadConfig(root?: string): Promise<Configuration>;
