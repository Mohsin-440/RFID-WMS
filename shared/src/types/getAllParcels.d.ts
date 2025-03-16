import { Status } from "./enums";


type Parcel = {
    parcelStatuses: {
        id: string;
        status: Status;
        createdAt: Date;
    }[];
    parcelWeight: number;
    id: string;
    parcelName: string;
    parcelPrice: string;
    parcelDate: Date;
    parcelTrackingNumber: string;
    senderFirstName: string;
    senderLastName: string;
    senderEmail: string;
    senderPhoneNumber: string;
    senderAddress: string;
    receiverFirstName: string;
    receiverLastName: string;
    receiverEmail: string;
    receiverPhoneNumber: string;
    receiverAddress: string;
    warehouseId: string;
    createdAt: Date;

}

export type GetAllParcels = {
    res: {
        success: boolean;
        message: string;
        parcels: [];

    } | {
        success: boolean;
        parcels: Parcel[]
    }
}