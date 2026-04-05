import dotenv from "dotenv";
import path from "node:path";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

export const env = {
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN ?? "",
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID ?? "",
  DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID ?? "",
  DASHBOARD_CHANNEL_ID: process.env.DASHBOARD_CHANNEL_ID ?? "",
};

if (!env.DISCORD_BOT_TOKEN) {
  throw new Error("DISCORD_BOT_TOKEN não definido");
}

if (!env.DASHBOARD_CHANNEL_ID) {
  throw new Error("DASHBOARD_CHANNEL_ID não definido");
}