module Talk {
    export interface IMessage {
        peer: string; // ID of the peer which generated it
        key: string;
        value: any;
    }
}