import { Request, Response } from 'express'
import db from "../../utils/db.js"; // Create a new Warehouse

import { z } from 'zod'

const editWarehouseSchema = z.object({
    warehouseName: z.string().min(1, "Warehouse name is required"),
    warehouseAddress: z.string().min(1, "Warehouse address is required"),
})

export const editWarehouse = async (req: Request, res: Response) => {
    try {

        const { warehouseId } = req.params
       

        // Validate request body
        const validatedData = editWarehouseSchema.parse(req.body)

        // Check if warehouse exists
        const existingWarehouse = await db.warehouse.findUnique({
            where: { id: warehouseId }
        })

        if (!existingWarehouse) {
            res.status(404).json({
                status: "error",
                message: "Warehouse not found"
            })
            return
        }

        // Check if warehouse name already exists (excluding current warehouse)
        const warehouseWithSameName = await db.warehouse.findFirst({
            where: {
                warehouseName: validatedData.warehouseName,
                NOT: {
                    id: warehouseId
                }
            }
        })

        if (warehouseWithSameName) {
            res.status(400).json({
                status: "error",
                warehouseName: "Warehouse name already exists"
            })
            return
        }
        const warehouseWithSameAddress = await db.warehouse.findFirst({
            where: {
                warehouseAddress: validatedData.warehouseAddress,
                NOT: {
                    id: warehouseId
                }
            }
        })

        if (warehouseWithSameAddress) {
            res.status(400).json({
                status: "error",
                warehouseAddress: "Warehouse address already exists"
            })
            return
        }

        // Update warehouse
        const updatedWarehouse = await db.warehouse.update({
            where: { id: warehouseId },
            data: {
                warehouseName: validatedData.warehouseName,
                warehouseAddress: validatedData.warehouseAddress,
            }
        })
        res.status(200).json({
            status: "success",
            message: "Warehouse updated successfully",
            data: updatedWarehouse
        })

        return
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                status: "error",
                message: error.errors[0].message
            })
            return
        }

        console.error("Error updating warehouse:", error)
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        })
        return
    }
}