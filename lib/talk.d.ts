interface Logger {
    debug: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    log: (...args: any[]) => void;
}

interface Message {
    handler: any[];
    peer: string;
    key: string;
    value: any;
}