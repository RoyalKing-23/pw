import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import ServerConfig from "@/models/ServerConfig";
import bcrypt from "bcryptjs";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { username, password } = req.body;

    if (!username || !password) {
        return res
            .status(400)
            .json({ message: "Username and password are required" });
    }

    try {
        await dbConnect();

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update the ServerConfig (assuming ID 1 is the main config)
        const result = await ServerConfig.findOneAndUpdate(
            { _id: 1 },
            {
                $set: {
                    username: username,
                    password: hashedPassword,
                },
            },
            { new: true, upsert: true } // Create if doesn't exist
        );

        return res.status(200).json({
            success: true,
            message: "Admin credentials updated successfully",
            config: {
                username: result.username,
                // Don't return the password
            },
        });
    } catch (error: any) {
        console.error("Reset Admin Error:", error);
        return res
            .status(500)
            .json({ message: "Internal Server Error", error: error.message });
    }
}
