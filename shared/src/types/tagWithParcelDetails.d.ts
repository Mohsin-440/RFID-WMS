import { ParcelDetailsWithStatus } from "./parcelDetailsWithStatus";

export type TagWithParcelDetails = {
    readCount: number;
    rssiValue: number;
    antennaId: number;
    frequency: number;
    timestamp: number;
    tagdatalength: number;
    epclength: number;
    pc: number;
    epcId: string;
    epcCrc: string;
    parcel: ParcelDetailsWithStatus;
}