import { ChannelType, Client, Message } from "discord.js";
import { env } from "../config/env";
import { renderDashboard } from "./dashboard.renderer";
import { DASHBOARD_MARKER } from "./dashboard.constants";
import type { DashboardView } from "./dashboard.types";

export async function publishOrUpdateDashboard(
  client: Client,
  view: DashboardView = "home",
): Promise<Message> {
  const channel = await client.channels.fetch(env.DASHBOARD_CHANNEL_ID);

  if (!channel) {
    throw new Error("Canal do dashboard não encontrado");
  }

  if (channel.type !== ChannelType.GuildText) {
    throw new Error("DASHBOARD_CHANNEL_ID precisa ser um canal de texto do servidor");
  }

  const messages = await channel.messages.fetch({ limit: 20 });

  const existingMessage = messages.find(
    (message) =>
      message.author.id === client.user?.id &&
      message.embeds[0]?.footer?.text === DASHBOARD_MARKER,
  );

  const payload = renderDashboard(view, channel.guild.id);

  if (existingMessage) {
    return existingMessage.edit(payload);
  }

  return channel.send(payload);
}