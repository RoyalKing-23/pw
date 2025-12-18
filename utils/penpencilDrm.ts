import base64 from "base-64";


// Replace with your actual JWT token
const PENPENCIL_TOKEN = "<YOUR_TOKEN_HERE>";

const headers = {
  "Host": "api.penpencil.xyz",
  "content-type": "application/json",
  "authorization": `Bearer ${PENPENCIL_TOKEN}`,
  "client-version": "11",
  "user-agent":
    "Mozilla/5.0 (Linux; Android 10; PACM00) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.98 Mobile Safari/537.36",
  "Client-Type": "WEB",
  "accept-encoding": "gzip",
};

function encodeUtf16Hex(input: string): string {
  return [...input].map((char) => char.charCodeAt(0).toString(16).padStart(4, "0")).join("");
}

function xorStringToBase64(kid: string, token: string): string {
  const xorBytes = Array.from(kid).map((char, i) =>
    char.charCodeAt(0) ^ token.charCodeAt(i % token.length)
  );
  return base64
    .encode(String.fromCharCode(...xorBytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=*$/, "");
}

function decodeOtpKey(otp: string, token: string): string {
  const buffer = base64.decode(otp);
  const result = [...buffer].map((char, i) =>
    String.fromCharCode(char.charCodeAt(0) ^ token.charCodeAt(i % token.length))
  );
  return result.join("");
}

async function getOtpKey(kid: string): Promise<string> {
  const base64Key = xorStringToBase64(kid, PENPENCIL_TOKEN);
  const encodedHex = encodeUtf16Hex(base64Key);
  const otpUrl = `https://api.penpencil.xyz/v1/videos/get-otp?key=${encodedHex}&isEncoded=true`;

  const res = await fetch(otpUrl, { headers });
  const data = await res.json();

  if (!data?.data?.otp) throw new Error("OTP not found");
  return decodeOtpKey(data.data.otp, PENPENCIL_TOKEN);
}

async function getPsshAndKid(mpdUrl: string): Promise<{ pssh: string; kid: string }> {
  const res = await fetch(mpdUrl);
  const xml = await res.text();

  const psshMatch = xml.match(/<cenc:pssh>([^<]+)<\/cenc:pssh>/);
  const kidMatch = xml.match(/default_KID="([\w-]+)"/);

  if (!psshMatch || !kidMatch) throw new Error("Failed to extract PSSH/KID");

  const pssh = psshMatch[1];
  const kid = kidMatch[1].replace(/-/g, "");
  return { pssh, kid };
}

export async function getPenpencilDrmKey(mpdUrl: string): Promise<{
  pssh: string;
  kid: string;
  key: string;
}> {
  const { pssh, kid } = await getPsshAndKid(mpdUrl);
  const key = await getOtpKey(kid);
  return { pssh, kid, key };
}
