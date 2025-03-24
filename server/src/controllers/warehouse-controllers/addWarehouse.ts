import { Request, Response } from "express";
import db from "../../utils/db.js"; // Create a new Warehouse
import { getCachedUser } from "../../utils/getCachedUser.js";
import { getUserFromDb } from "../../utils/getUserFromDb.js";
export const addWarehouse = async (req: Request, res: Response) => {
  const { warehouseName, warehouseAddress } = req.body;

  try {
    // Validate input
    if (!warehouseName || !warehouseAddress) {
      res.status(400).json({
        success: false,
        message: "Warehouse name and address are required",
      });
      return;
    }

    const findWarehouseName = await db.warehouse.findUnique({
      where: {
        warehouseName
      }
    });
    if (findWarehouseName) {
      res.status(403).json({ warehouseName: "Warehouse name already exists" });
      return
    }
    
    const findWarehouseAddress = await db.warehouse.findUnique({
      where: {
        warehouseAddress
      }
    });
    if (findWarehouseAddress) {
      res.status(403).json({ warehouseAddress: "Warehouse address already exists" });
      return
    }
    // Create warehouse
    const newWarehouse = await db.warehouse.create({
      data: {
        warehouseName,
        warehouseAddress,
      },
    });

    res.status(201).json({
      success: true,
      message: "Warehouse created successfully",
      data: newWarehouse,
    });

    const users = await db.user.findMany({
      where: {
        role: "Admin"
      }
    })
    for (const user of users) {
      const userWarehouse = await db.warehouseUser.create({
        data: {
          isPrimary: false,
          userId: user.id,
          warehouseId: newWarehouse.id
        }
      })
      const userFromDb = await getUserFromDb({ userId: user.id })
      await getCachedUser({ userId: user.id, userBody: userFromDb })
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while creating the warehouse",
    });
    return;
  }
};
