export type ParcelDetailsWithStatus = {
    id: string;
    parcelName: string;
    parcelPrice: string;
    parcelDate: Date;
    parcelTrackingNumber: string;
    parcelWeight: number;
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
    rfidTagId: string;
    warehouseId: string;
    createdAt: Date;
    parcelStatuses: {
        id: string;
        createdAt: Date;
        status: "Pending" | "Dispatched" | "Delivered";
    }[];
} 