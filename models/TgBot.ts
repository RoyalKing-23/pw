import mongoose from "mongoose";

const channelSchema = new mongoose.Schema({
  channelLink: String,
  channelName: String,
  channelType: String,
});

const tgBotSchema = new mongoose.Schema({
  ownerId: String,
  log_channel_Id: String,
  webUrl: String,
  ownerUsername: String,
  channels: [channelSchema],
}, { timestamps: true });

export default mongoose.models.TgBot || mongoose.model("TgBot", tgBotSchema);
