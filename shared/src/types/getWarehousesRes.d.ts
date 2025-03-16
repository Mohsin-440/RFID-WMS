export type GetWarehousesResponse = {
    success: boolean;
    message: string;
    data: Warehouse[];
};

type Warehouse = {
    id: string;
    warehouseName: string;
    warehouseAddress: string;
};
