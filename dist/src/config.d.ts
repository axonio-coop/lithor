export interface Configuration {
    name: string;
    commands: {
        extends: string;
        section: string;
        yield: string;
        include: string;
    };
    paths: {
        build: string;
        commands: string;
        public: string;
        src: string;
        pages: string;
        templates: string;
    };
    watch: {
        port: number;
        wsPort: number;
        open: boolean;
    };
}
export default function loadConfig(): Promise<Configuration>;
