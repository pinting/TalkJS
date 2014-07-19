module Talk.Packet.Buffer {
    export interface IPacket {
        payload: IBuffer;
        length: number;
        index: number;
    }
}