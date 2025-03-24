import { Request, Response } from "express";
import db from "../../utils/db.js"; // Create a new Warehouse
export const getAllWarehouses = async (req: Request, res: Response) => {

  try {
    const warehouses = await db.warehouse.findMany({ orderBy: [{ warehouseName: "asc" }] });

    res.status(200).json({
      success: true,
      message: "Warehouse list successfully",
      data: warehouses,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while getting warehouses.",
    });
    return;
  }
};
