module Talk {
    export interface IMessage {
        group: string[]; // List of the groups which its come through
        peer: string; // ID of the peer which generated it
        key: string;
        value: any;
    }
}