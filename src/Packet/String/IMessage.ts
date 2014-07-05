module Talk.Packet.String {
    export interface IMessage {
        key: string;
        value: any;
        id: string; // ID of the handler
    }
}