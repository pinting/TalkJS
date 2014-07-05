module Talk {
    export interface ILogger {
        warn: (...args: any[]) => void;
        log: (...args: any[]) => void;
    }
}