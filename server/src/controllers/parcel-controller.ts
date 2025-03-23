import { Request, Response } from "express";
import db from "../utils/db";
import { GetAllParcels } from "shared/types/getAllParcels"
import { ParcelDetailsWithStatus } from "../../../shared/src/types/parcelDetailsWithStatus";
import { redisClient } from "../utils/redis";
import { z } from "zod";

const parcelSchema = z.object({
  parcelName: z.string().min(1, "Parcel Name is required"),
  parcelPrice: z.string().min(1, "Parcel Price is required"),
  parcelDate: z.string().min(1, "Parcel Date is required"),
  parcelTrackingNumber: z.string().min(1, "Parcel Tracking Number is required"),
  parcelWeight: z.string().min(1, "Parcel Weight is required"),
  senderFirstName: z.string().min(1, "Sender First Name is required"),
  senderLastName: z.string().min(1, "Sender Last Name is required"),
  senderEmail: z
    .string()
    .email("Invalid email address")
    .min(1, "Sender Email is required"),
  senderPhoneNumber: z.string().min(1, "Sender Phone Number is required"),
  senderAddress: z.string().min(1, "Sender Address is required"),
  receiverFirstName: z.string().min(1, "Receiver First Name is required"),
  receiverLastName: z.string().min(1, "Receiver Last Name is required"),
  receiverEmail: z
    .string()
    .email("Invalid email address")
    .min(1, "Receiver Email is required"),
  receiverPhoneNumber: z.string().min(1, "Receiver Phone Number is required"),
  receiverAddress: z.string().min(1, "Receiver Address is required"),
});

type FormData = z.infer<typeof parcelSchema>;
export const createParcel = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unautorized access", success: false })
      return
    }
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
      data: { ...parcelDetails },
    });


    // Create an initial status in the ParcelStatus table
    const parcelStatusCreated = await db.parcelStatus.create({
      data: {
        parcelId: createdParcel.id,
        userId: req.user.id, // Ensure userId is provided in the request
        status: "Pending",
      },
    });
    const createdParcelDetails = await db.parcelDetails.findUnique({
      where: {
        id: createdParcel.id
      },
      select: {
        id: true,
        parcelTrackingNumber: true,
        parcelWeight: true,
        parcelDate: true,
        rfidTagId: true,
        warehouseId: true,
        createdAt: true,
        parcelName: true,
        parcelPrice: true,
        receiverAddress: true,
        receiverEmail: true,
        receiverFirstName: true,
        receiverLastName: true,
        receiverPhoneNumber: true,
        senderAddress: true,
        senderEmail: true,
        senderFirstName: true,
        senderLastName: true,
        senderPhoneNumber: true,

        parcelStatuses: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
          orderBy: [{ createdAt: "desc" }],

        }
      }
    }) as ParcelDetailsWithStatus

    await redisClient.set(`wsm-parcelFromTagId:${createdParcelDetails.rfidTagId}`, JSON.stringify(createdParcelDetails))

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
    const parcelStringed = await redisClient.get(`wsm-parcel:${id}`)

    if (parcelStringed) {
      try {
        const parcel = JSON.parse(parcelStringed) as ParcelDetailsWithStatus
        res.status(200).json({
          success: true,
          parcel,
          parcelStatus: parcel.parcelStatuses[0].status
        });

        return
      } catch (error) {

      }
      
    }

    const parcel = await db.parcelDetails.findUnique({
      where: { id },
      select: {
        id: true,
        parcelTrackingNumber: true,
        parcelWeight: true,
        parcelDate: true,
        rfidTagId: true,
        warehouseId: true,
        createdAt: true,
        parcelName: true,
        parcelPrice: true,
        receiverAddress: true,
        receiverEmail: true,
        receiverFirstName: true,
        receiverLastName: true,
        receiverPhoneNumber: true,
        senderAddress: true,
        senderEmail: true,
        senderFirstName: true,
        senderLastName: true,
        senderPhoneNumber: true,
        parcelStatuses: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
          orderBy: [{ createdAt: "desc" }],

        }
      }
    });

    if (!parcel) {
      res.status(404).json({
        success: false,
        message: "Parcel not found",
      });
    } else {
      res.status(200).json({
        success: true,
        parcel,
      });
      await redisClient.set(`wsm-parcel:${parcel.id}`, JSON.stringify(parcel))
      await redisClient.set(`wsm-parcelFromTagId:${parcel.rfidTagId}`, JSON.stringify(parcel))
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
    const parcelDetails = req.body as FormData;

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

    const formattedDate = new Date(parcelDetails.parcelDate);
    if (parcelDetails.parcelDate) {
      if (!isNaN(formattedDate.getTime()))
        parcelDetails.parcelDate = formattedDate.toISOString();

      else {

        res.status(400).json({
          success: false,
          message:
            "Invalid date format for parcelDate. Please use a valid date.",
        });

        return;
      }
    }

    const weight = parseFloat(parcelDetails.parcelWeight);

    if (parcelDetails.parcelWeight) {


      if (isNaN(weight) || weight <= 0) {
        res.status(400).json({
          success: false,
          message:
            "Invalid weight for parcelWeight. Please provide a valid positive number.",
        });
        return;
      }


    }



    const updatedParcel = await db.parcelDetails.update({
      where: { id },
      data: {
        parcelDate: formattedDate,
        parcelName: parcelDetails.parcelName,
        parcelPrice: parcelDetails.parcelPrice,
        parcelTrackingNumber: parcelDetails.parcelTrackingNumber,
        parcelWeight: weight,
        receiverAddress: parcelDetails.receiverAddress,
        receiverEmail: parcelDetails.receiverEmail,
        receiverFirstName: parcelDetails.receiverFirstName,
        receiverLastName: parcelDetails.receiverLastName,
        receiverPhoneNumber: parcelDetails.receiverPhoneNumber,
        senderAddress: parcelDetails.senderAddress,
        senderEmail: parcelDetails.senderEmail,
        senderFirstName: parcelDetails.senderFirstName,
        senderLastName: parcelDetails.senderLastName,
        senderPhoneNumber: parcelDetails.senderPhoneNumber,
      },
      select: {
        id: true,
        parcelTrackingNumber: true,
        parcelWeight: true,
        parcelDate: true,
        rfidTagId: true,
        warehouseId: true,
        createdAt: true,
        parcelName: true,
        parcelPrice: true,
        receiverAddress: true,
        receiverEmail: true,
        receiverFirstName: true,
        receiverLastName: true,
        receiverPhoneNumber: true,
        senderAddress: true,
        senderEmail: true,
        senderFirstName: true,
        senderLastName: true,
        senderPhoneNumber: true,
        parcelStatuses: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
          orderBy: [{ createdAt: "desc" }],

        }
      }
    });

    await redisClient.set(`wsm-parcel:${updatedParcel.id}`, JSON.stringify(updatedParcel))
    await redisClient.set(`wsm-parcelFromTagId:${updatedParcel.rfidTagId}`, JSON.stringify(updatedParcel))

    res.status(200).json({
      success: true,
      message: "Parcel updated successfully",
      parcel: updatedParcel
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
    console.log("first", id)
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
    console.log("first", tagIds)

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
        rfidTagId: { in: tagIds },
      },
      include: {
        parcelStatuses: true,
      },
    });

    if (existingParcels.length === 0) {
      res.status(404).json({
        success: false,
        message: "No matching parcels found in the database",
      });
      return;
    }

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

    await db.parcelStatus.createMany({
      data: parcelsToUpdate.map(parcel => ({
        status: "Dispatched",
        parcelId: parcel.id,
        userId: req.user?.id as string,
      })),
    });

    const updatedParcels = parcelsToUpdate.map(parcel => ({
      parcelTrackingNumber: parcel.parcelTrackingNumber,
      tagId: parcel.rfidTagId,
    }));

    res.status(200).json({
      success: true,
      message: `${parcelsToUpdate.length} parcel(s) updated to Dispatched`,
      updatedParcels,
    });

    for (const existingParcel of existingParcels) {
      const updatedParcel = await db.parcelDetails.findUnique({
        where: {
          id: existingParcel.id
        },
        select: {
          id: true,
          parcelTrackingNumber: true,
          parcelWeight: true,
          parcelDate: true,
          rfidTagId: true,
          warehouseId: true,
          createdAt: true,
          parcelName: true,
          parcelPrice: true,
          receiverAddress: true,
          receiverEmail: true,
          receiverFirstName: true,
          receiverLastName: true,
          receiverPhoneNumber: true,
          senderAddress: true,
          senderEmail: true,
          senderFirstName: true,
          senderLastName: true,
          senderPhoneNumber: true,
          parcelStatuses: {
            select: {
              id: true,
              status: true,
              createdAt: true,
            },
            orderBy: [{ createdAt: "desc" }],

          }
        }
      });
      if (updatedParcel) {
        await redisClient.set(`wsm-parcel:${updatedParcel.id}`, JSON.stringify(updatedParcel))
        await redisClient.set(`wsm-parcelFromTagId:${updatedParcel.rfidTagId}`, JSON.stringify(updatedParcel))
      }

    }

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
