module Talk.Packet.String {
    /**
     * Used for communication between string packet handlers
     */

    export interface IMessage {
        key: string;
        value: any;
        id: string; // ID of the handler
    }
}