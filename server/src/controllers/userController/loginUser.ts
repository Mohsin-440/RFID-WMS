import e, { Request, Response } from "express";
import db from "../../utils/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getUserFromDb } from "../../utils/getUserFromDb";
import { redisClient } from "../../utils/redis";
import { getCachedUser } from "../../utils/getCachedUser";
export const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;


        const existingUser = await getUserFromDb({ email });

        if (!existingUser) {
            res.status(404).json({
                success: false,
                message: "Invalid email or password",
            });
            return;
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            existingUser.password
        );

        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
            return;
        }


        const token = jwt.sign(
            { userId: existingUser.id, email: existingUser.email },
            process.env.JWT_SECRET as string,
            { expiresIn: "1h" }
        );

        res.cookie("authToken", token, {
            httpOnly: true,
            maxAge: 60 * 60 * 1000, // 1 hour
        });

        delete (existingUser as any)?.password;

        const { user, sessionSocketIds, error } = await getCachedUser({ userId: existingUser.id });
        if (error) {
            console.log(`error occurred while getting cached user in login controller: ${error}`)
        }
        if (user && sessionSocketIds)
            await redisClient.set(`wms-user:${existingUser.id}`, JSON.stringify({ user: existingUser, sessionSocketIds }));
        else
            await redisClient.set(`wms-user:${existingUser.id}`, JSON.stringify({ user: existingUser }));


        const resBody = {
            success: true,
            message: "Logged in successfully",
            user: existingUser,
        }

        res.status(200).json(resBody);

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to login",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};