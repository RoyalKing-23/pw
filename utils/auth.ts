// utils/auth.ts
import { v4 as uuidv4 } from "uuid";

export function getHeaders(token: string) {
  return {
  accept: "application/json, text/plain, */*",
  "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,hi;q=0.7,zh-CN;q=0.6,zh;q=0.5",
Authorization: `Bearer ${token.trim()}`,
  "client-id": "5eb393ee95fab7468a79d189",
  "client-type": "WEB",
  "client-version": "2.1.1",
  origin: "https://study-mf.pw.live",
  referer: "https://study-mf.pw.live/",
  priority: "u=1, i",
  randomid: uuidv4(),
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
};

}

export function getVideoHeaders(token: string, randomId: string) {

  return {
    accept: "*/*",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,hi;q=0.7,zh-CN;q=0.6,zh;q=0.5",
    audiocodeccapability: JSON.stringify({
      "AAC-LC": {
        isSupported: true,
        Profile: [
          { container: "audio/mp4", supported: true },
          { container: "audio/webm", supported: false },
          { container: "audio/ogg", supported: false },
        ],
      },
      "HE-AAC v1": {
        isSupported: true,
        Profile: [
          { container: "audio/mp4", supported: true },
          { container: "audio/webm", supported: false },
          { container: "audio/ogg", supported: false },
        ],
      },
      "HE-AAC v2": {
        isSupported: true,
        Profile: [
          { container: "audio/mp4", supported: true },
          { container: "audio/webm", supported: false },
          { container: "audio/ogg", supported: false },
        ],
      },
    }),
    authorization: `Bearer ${token}`,
    "client-id": "5eb393ee95fab7468a79d189",
    "client-type": "WEB",
    "client-version": "200",
    "content-type": "application/json",
    devicememory: "8192",
    devicestreamingtechnology: JSON.stringify({
      dash: {
        isSupported: true,
        formats: ["mp4", "m4a"],
        codecs: ["avc1", "aac"],
      },
      hls: {
        isSupported: false,
        formats: [],
        codecs: [],
      },
    }),
    devicetype: "desktop",
    drmcapability: JSON.stringify({
      aesSupport: "yes",
      fairPlayDrmSupport: "no",
      playreadyDrmSupport: "no",
      widevineDRMSupport: "yes",
    }),
    frameratecapability: JSON.stringify({
      videoQuality: "720p (HD)",
    }),
    networktype: "4g",
    origin: "https://www.pw.live",
    priority: "u=1, i",
        randomid: randomId,

    referer: "https://www.pw.live/",
    screenresolution: "1366 x 768",
    "sec-ch-ua": '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    videocodeccapability: JSON.stringify({
      Hevc: {
        isSupported: "false",
        Profile: [],
      },
      AV1: {
        isSupported: "true",
        Profile: [
          { name: "Main" },
          { name: "High" },
          { name: "Professional" },
        ],
      },
    }),
  };
}

