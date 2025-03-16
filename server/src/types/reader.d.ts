export type Reader = {
    id: string;
    readerServerId: string;
    serialNumber: string | null;
    readerYearModel: bigint | null;
    address: string;
    role: string;
    warehouseId: string;
    connectionStatus: "connected" | "not-connected";
}