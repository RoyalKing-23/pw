import dbConnect from "@/lib/mongodb";
import ServerConfig from "@/models/ServerConfig";

export async function getServerConfig() {
    try {
        await dbConnect();
        const config = await ServerConfig.findOne({ _id: 1 }).lean() as any;
        if (!config) {
            return null;
        }
        return {
            webName: config.webName,
            sidebarLogoUrl: config.sidebarLogoUrl,
            sidebarTitle: config.sidebarTitle,
            tg_channel: config.tg_channel,
            tg_username: config.tg_username,
            isDirectLoginOpen: config.isDirectLoginOpen,
            tg_bot: config.tg_bot,
        };
    } catch (error) {
        console.error("[getServerConfig] Error:", error);
        return null;
    }
}
