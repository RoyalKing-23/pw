// pages/api/promotion.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const promo = {
    title: "🔥 Cheap VPS @ 500₹ ! !",
    message: `Everything up to 50% off — only this week!\n\nJoin Our Telegram Channel! and book a free demo now!`,
    imageUrl:
      "https://adsempire.com/blog/wp-content/uploads/adsempire/1132x670_AE_telegram_hid.png",
  };

  res.status(200).json({ promo });
}
