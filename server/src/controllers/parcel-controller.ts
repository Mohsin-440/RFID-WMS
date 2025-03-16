import { Request, Response } from "express";
import db from "../utils/db.js";
import { GetAllParcels } from "shared/types/getAllParcels"

export const createParcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const parcelDetails = req.body;

    // Set the parcelDate to the current timestamp
    parcelDetails.parcelDate = new Date().toISOString();

    // check warehouseId is exist in db
    const warehouse = await db.warehouse.findUnique({
      where: {
        id: parcelDetails.warehouseId
      }
    });

    if (!warehouse) {
      res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
      return;
    }

    parcelDetails.warehouseId = warehouse.id; 

    const rfidTagIdExist = await db.parcelDetails.findFirst({
      where: {
        rfidTagId: parcelDetails.rfidTagId
      }
    })

    if (rfidTagIdExist) {
      res.status(409).json({
        success: false,
        message: "RFID Tag ID is already assigned to another parcel",
      });
      return;
    }

    // Convert parcelWeight to float
    if (parcelDetails.parcelWeight) {
      const weight = parseFloat(parcelDetails.parcelWeight);
      if (isNaN(weight) || weight <= 0) {
        res.status(400).json({
          success: false,
          message:
            "Invalid weight for parcelWeight. Please provide a valid positive number.",
        });
        return; // Ensure the function exits after sending a response
      }
      parcelDetails.parcelWeight = weight; // Store weight as a float
    }

    // Create parcel in the database
    const createdParcel = await db.parcelDetails.create({
      data: {...parcelDetails},
    });


    // Create an initial status in the ParcelStatus table
    await db.parcelStatus.create({
      data: {
        parcelId: createdParcel.id,
        userId: req.user?.id || '6c887d83-44ad-408d-9cb2-7111470e6f4e', // Ensure userId is provided in the request
        status: "Pending",
      },
    });

    res.status(201).json({
      success: true,
      message: "Parcel created successfully",
    });
  } catch (error) {
    console.error("Error creating parcel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create parcel",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const allParcels = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {

    const parcels = await db.parcelDetails.findMany({
      include: {
        parcelStatuses: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
          orderBy: [{ createdAt: "desc" }]
        }
      },
    });


    if (parcels.length === 0) {
      const resBody: GetAllParcels["res"] = {
        success: true,
        message: "No parcels found in the database",
        parcels: [],
      }
      res.status(200).json(resBody);
    } else {
      const resBody: GetAllParcels["res"] = {
        success: true,
        parcels,
      }
      res.status(200).json(resBody);
    }
  } catch (error) {
    console.error("Error retrieving parcels:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve parcels",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const singleParcel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parcel = await db.parcelDetails.findUnique({
      where: { id },
      include: {
        parcelStatuses: {
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    });
    const parcelStatus = await db.parcelStatus.findMany({
      where: { parcelId: id },
      orderBy: { createdAt: "desc" },
    })
    
    if (!parcel) {
      res.status(404).json({
        success: false,
        message: "Parcel not found",
      });
    } else {
      res.status(200).json({
        success: true,
        parcel,
        parcelStatus : parcelStatus[0].status
      });
    }
  } catch (error) {
    console.error("Error retrieving parcel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve parcel",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateParcel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parcelDetails = req.body;
    console.log({parcelDetails})

    // Check if the parcel exists
    const existingParcel = await db.parcelDetails.findUnique({
      where: { id },
    });
    if (!existingParcel) {
      res.status(404).json({
        success: false,
        message: "Parcel not found",
      });
      return;
    }

    // Ensure parcelDate is in ISO format
    if (parcelDetails.parcelDate) {
      const formattedDate = new Date(parcelDetails.parcelDate);
      if (!isNaN(formattedDate.getTime())) {
        parcelDetails.parcelDate = formattedDate.toISOString();
      } else {
        res.status(400).json({
          success: false,
          message:
            "Invalid date format for parcelDate. Please use a valid date.",
        });
        return;
      }
    }

    // Convert parcelWeight to float
    if (parcelDetails.parcelWeight) {
      const weight = parseFloat(parcelDetails.parcelWeight);
      if (isNaN(weight) || weight <= 0) {
        res.status(400).json({
          success: false,
          message:
            "Invalid weight for parcelWeight. Please provide a valid positive number.",
        });
        return;
      }
      parcelDetails.parcelWeight = weight; // Store weight as a float
    }

    // If no status is provided, keep the existing status
    if (!parcelDetails.status) {
      parcelDetails.status = existingParcel;
    }

    // Update the parcel in the database
    await db.parcelDetails.update({
      where: { id },
      data: parcelDetails,
    });

    res.status(200).json({
      success: true,
      message: "Parcel updated successfully",
    });
  } catch (error) {
    console.error("Error updating parcel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update parcel",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateParcelStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    console.log("first",id)
    // Find the parcel by ID
    const existingParcel = await db.parcelDetails.findUnique({
      where: { id },
      include: {
        parcelStatuses: true,
      }
    });
    if (!existingParcel) {
      res.status(404).json({
        success: false,
        message: "Parcel not found",
      });
      return; // Ensure no further code executes after response
    }
    let parcelStatus = existingParcel?.parcelStatuses?.[existingParcel.parcelStatuses.length - 1].status
    // Update the status based on current status
    if (parcelStatus === "Pending") {
      await db.parcelStatus.create({
        data: {
          status: "Dispatched",
          parcelId: id,
          userId: req.user?.id as string
        },
      });
      res.status(200).json({
        success: true,
        message: "Parcel status updated to Dispatched successfully",
      });
    } else if (parcelStatus === "Dispatched") {
      await db.parcelStatus.create({
        data: {
          status: "Delivered",
          parcelId: id,
          userId: req.user?.id as string
        },
      });
      res.status(200).json({
        success: true,
        message: "Parcel status updated to Delivered successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message:
          "Parcel is already in Delivered status or cannot be updated further.",
      });
    }
  } catch (error) {
    console.error("Error updating parcel status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update parcel status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateDispatchParcelsStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tagIds } = req.body; // Receive an array of tagIds from the frontend
    console.log("first",tagIds)

    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      res.status(400).json({
        success: false,
        message: "No tag IDs provided",
      });
      return;
    }

    console.log("Received tagIds:", tagIds);

    // Find all parcels that have these tag IDs
    const existingParcels = await db.parcelDetails.findMany({
      where: {
        rfidTagId: { in: tagIds }, // Only fetch parcels with matching tag IDs
      },
      include: {
        parcelStatuses: true, // Include status history to check current status
      },
    });

    if (existingParcels.length === 0) {
      res.status(404).json({
        success: false,
        message: "No matching parcels found in the database",
      });
      return;
    }

    // Filter parcels that are currently in "Pending" status
    const parcelsToUpdate = existingParcels.filter((parcel) => {
      const lastStatus = parcel.parcelStatuses?.[parcel.parcelStatuses.length - 1]?.status;
      return lastStatus === "Pending";
    });

    if (parcelsToUpdate.length === 0) {
      res.status(400).json({
        success: false,
        message: "No parcels are in 'Pending' status to update",
      });
      return;
    }

    // Update status of eligible parcels to "Dispatched"
    await db.parcelStatus.createMany({
      data: parcelsToUpdate.map(parcel => ({
        status: "Dispatched",
        parcelId: parcel.id,
        userId: req.user?.id as string, // Assuming user ID is available
      })),
    });

    // Extract updated parcel IDs and tag IDs
    const updatedParcels = parcelsToUpdate.map(parcel => ({
      parcelTrackingNumber: parcel.parcelTrackingNumber,
      tagId: parcel.rfidTagId,
    }));

    res.status(200).json({
      success: true,
      message: `${parcelsToUpdate.length} parcel(s) updated to Dispatched`,
      updatedParcels, 
    });

  } catch (error) {
    console.error("Error updating parcel statuses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update parcel statuses",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const deleteParcel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if the parcel exists
    const existingParcel = await db.parcelDetails.findUnique({
      where: { id },
    });

    if (!existingParcel) {
      res.status(404).json({
        success: false,
        message: "Parcel not found",
      });
      return; // Stop further execution if parcel not found
    }

    // Delete the parcel from the database
    await db.parcelDetails.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Parcel deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting parcel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete parcel",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
