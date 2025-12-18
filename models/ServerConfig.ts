// models/ServerConfig.ts
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export interface IShortnerServer {
  name: string;
  enabled: boolean;
  api_url: string;
  api_key: string;
}

export interface IServerConfig extends mongoose.Document {
  _id: number;
  webName: string;
  registrationOpen: boolean;
  sidebarLogoUrl: string;
  sidebarTitle: string;
  isDirectLoginOpen: boolean;
  password: string;
  tg_bot: string;
  tg_channel: string;
  tg_username: string;
  username: string;
  shortner_servers: IShortnerServer[];
  updatedAt: Date;
}

const serverConfigSchema = new mongoose.Schema<IServerConfig>(
  {
    _id: { type: Number, required: true, default: 1 },
    webName: { type: String, required: true },
    registrationOpen: { type: Boolean, required: true },
    sidebarLogoUrl: { type: String, required: true },
    sidebarTitle: { type: String, required: true },
    isDirectLoginOpen: { type: Boolean, required: false },
    password: { type: String, required: true },
    tg_bot: { type: String, required: true },
    tg_channel: { type: String, required: true },
    tg_username: { type: String, required: true },
    username: { type: String, required: true },
    shortner_servers: {
      type: [
        {
          name: { type: String, required: true },
          enabled: { type: Boolean, required: true },
          api_url: { type: String, required: true },
          api_key: { type: String, required: true },
        },
      ],
      required: true,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  }
);

// Hash password before saving if modified
serverConfigSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

const ServerConfig =
  mongoose.models.ServerConfig ||
  mongoose.model<IServerConfig>("ServerConfig", serverConfigSchema);

export default ServerConfig;