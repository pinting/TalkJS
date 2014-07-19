module Talk.Packet.Buffer {
    export interface IBuffer {
        slice: (start: number, end: number) => IBuffer;
        byteLength?: number;
        length?: number;
        size?: number;
    }
}