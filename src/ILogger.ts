module Talk {
    /**
     * Requirements for a custom logger class
     */

    export interface ILogger {
        warn: (...args: any[]) => void;
        log: (...args: any[]) => void;
    }
}