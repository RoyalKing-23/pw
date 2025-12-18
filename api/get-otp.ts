import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateUser, clearAuthCookies } from "@/utils/authenticateUser";
import axios from "axios";
import { getHeaders } from "@/utils/auth";
import { Buffer } from "buffer";

const PW_API = process.env.PW_API;
function encodeUtf16Hex(inputString: string): string {
  let hexString = "";
  for (let i = 0; i < inputString.length; i++) {
    hexString += inputString.charCodeAt(i).toString(16).padStart(4, "0");
  }
  return hexString;
}

function getClearKey(otp: string, secret: string): string {
  const decoded = Buffer.from(otp, "base64");
  const clearKey = Array.from(decoded)
    .map((byte, index) => {
      const secretChar = secret.charCodeAt(index % secret.length);
      return String.fromCharCode(byte ^ secretChar);
    })
    .join("");

  return clearKey;
}

function xorStrings(kid: string, token: string): string {
  const xorBytes: number[] = [];

  for (let i = 0; i < kid.length; i++) {
    const xor = kid.charCodeAt(i) ^ token.charCodeAt(i % token.length);
    xorBytes.push(xor);
  }

  return Buffer.from(xorBytes).toString("base64");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Step 1: Authenticate the user
    const user = await authenticateUser(req, res);
    const ActualToken = user?.ActualToken;

    // Step 2: Validate KID and token
    const { kid } = req.query;

    if (!kid || typeof kid !== "string") {
      return res
        .status(400)
        .json({ message: "`kid` is required as a query parameter" });
    }

    if (!ActualToken || typeof ActualToken !== "string") {
      return res
        .status(401)
        .json({ message: "User is not authenticated. No valid token found." });
    }

    // Step 3: Clean KID and XOR encode
    const cleanKid = kid.replace(/[-\s]/g, "");
    const KeyBase64 = xorStrings(cleanKid, ActualToken);
    const encodedHex = encodeUtf16Hex(KeyBase64);

    // Step 4: Call external API with encoded key
    const url = `${PW_API}/v1/videos/get-otp?key=${encodedHex}&isEncoded=true`;

    const response = await axios.get(url, {
      headers: getHeaders(ActualToken),
    });

    const otp = response.data?.data?.otp;

    if (!otp) {
      return res
        .status(502)
        .json({ message: "OTP not found in response from external service" });
    }

    // Step 5: Decrypt OTP
    const clearKey = getClearKey(otp, ActualToken);

    // Step 6: Return decrypted key
    return res.status(200).json({
      clearKeys: {
        [cleanKid]: clearKey,
      },
    });
  } catch (error: any) {
    const status = error.response?.status || 500;

    if (status === 401) {
      clearAuthCookies(res);
    }

    return res.status(status).json({
      message: error.message || "Failed to generate or retrieve OTP",
    });
  }
}
