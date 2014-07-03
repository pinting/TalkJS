module Talk.Packet.String {
    /**
     * A string packet
     */

    export interface IPacket {
        payload: string;
        length: number; // Number of packets, and NOT the length of the payload
        index: number; // Current packet index
    }
}