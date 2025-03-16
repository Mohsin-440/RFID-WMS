
export type ReaderDetails = {
    readerServerId: string;
    readerYearModel: number;
    serialNumber: string;
    address: string;
    role: string | undefined;
    connectionStatus: "connected" | "not-connected";
}