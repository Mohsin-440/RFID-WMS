import bcrypt from "bcrypt";
import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import db from "../utils/db.js";
import { RegisterValidator } from "shared/validators/registerValidator.js";


// Set the absolute path for the uploads directory
const uploadDirectory = path.resolve(__dirname, "../../uploads");

// Configure multer to use the absolute path
export const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDirectory);
    },
    filename: (req, file, cb) => {
      cb(
        null,
        file.fieldname + "_" + Date.now() + path.extname(file.originalname)
      );
    },
  }),
});

export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const body = req.body as RegisterValidator;

    const { email, password } = body;
    console.log(req.body)

    if (!password) {
      res.status(400).json({
        password: "Password is required",
      });
      return;
    }

    // Check if the user already exists
    const existingUser = await db.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({ email: "Email already exists", });
      return;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const profilePicture = req.file ? req.file.filename : null;

    const warehouseExist = await db.warehouse.findFirst({
      where: { id: body.warehouseId }
    })

    if (!warehouseExist) {
      res.status(404).json({ warehouseId: "Warehouse id not found" });
      return;
    }

    // Save the new user with the hashed password
    const newUser = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        profilePicture: profilePicture,
        firstName: body?.firstName,
        lastName: body.lastName,
        role: body.role,

      }, // Pass the prepared user data
    });

    const user = await db.warehouseUser.create({
      data: {
        userId: newUser.id,
        warehouseId: body.warehouseId,
        isPrimary: true,
      }
    })

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: newUser,
    });
    
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const logoutUser = (req: Request, res: Response): void => {
  try {
    // Clear the authToken cookie
    res.clearCookie("authToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // Send success response
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to logout",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get all users
export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const users = await db.user.findMany({
      select: {
        email: true,
        profilePicture: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: users,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve users",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
