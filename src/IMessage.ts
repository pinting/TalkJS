module Talk {
    export interface IMessage {
        handler: string[]; // List of the handlers which its come through
        peer: string; // ID of the peer which generated it
        key: string;
        value: any;
    }
}