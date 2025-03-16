import axios from "axios";
import { GetAllParcels } from "@wsm/shared/types/getAllParcels"
export const getAllParcelsData = async () => {
  try {
    const response = await axios.get<GetAllParcels["res"]>("http://localhost:4000/api/v1/parcel/all",
      { withCredentials: true });
    return response.data.parcels;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    throw new Error("Failed to get all parcels");
  }
};

export const updateParcelStatus = async (id: string) => {
  try {
    const response = await axios.put(
      `http://localhost:4000/api/v1/parcel/status/${id}`, null,
      { withCredentials: true }
    );
    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    throw new Error("Failed to update parcel status");
  }
};

export const deleteParcel = async (parcelId: string) => {
  try {
    const response = await axios.delete(
      `http://localhost:4000/api/v1/parcel/delete/${parcelId}`,
      { withCredentials: true }
    );
    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    throw new Error("Failed to delete parcel");
  }
};
