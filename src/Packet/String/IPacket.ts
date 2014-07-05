module Talk.Packet.String {
    export interface IPacket {
        payload: string;
        length: number; // Number of packets, and NOT the length of the payload
        index: number; // Current packet index
    }
}