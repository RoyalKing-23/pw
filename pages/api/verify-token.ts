import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: "Token is required" });
    }

    try {
        const externalResponse = await fetch("https://api.penpencil.co/v3/oauth/verify-token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        const data = await externalResponse.json();

        return res.status(externalResponse.status).json(data);
    } catch (error: any) {
        console.error("Error verifying token:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
