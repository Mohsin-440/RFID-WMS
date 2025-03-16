import axios from "axios";
// import { GetWarehousesResponse } from "@wsm/shared/types/getWarehousesRes";

export const getAllWarehousesData = async () => {
    try {
        const response = await axios.get("http://localhost:4000/api/v1/warehouse",
            { withCredentials: true });
        return response.data;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        throw new Error("Failed to get all warehouses");
    }
};

export const addWarehouse = async () => {
    try {
        const response = await axios.post("http://localhost:4000/api/v1/warehouse/add",);
        return response.data;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        throw new Error("Failed to update parcel status");
    }
};

