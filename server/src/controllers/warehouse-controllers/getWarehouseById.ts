import { Request, Response } from "express";
import db from "../../utils/db.js"; // Create a new Warehouse
export const getWarehouseById = async (req: Request, res: Response) => {

  try {
    const { warehouseId } = req.params

    const warehouse = await db.warehouse.findUnique({
      where: {
        id: warehouseId
      }
    });
    
    if (!warehouse) {
      res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });

      return;

    }

    else {

      res.status(200).json({
        success: true,
        message: "Warehouse list successfully",
        data: warehouse,
      });

      return
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while getting warehouses.",
    });
    return;
  }
};
