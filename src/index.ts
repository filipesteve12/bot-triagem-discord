import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  Interaction,
} from "discord.js";
import { env } from "./config/env";
import { pingCommand } from "./commands/ping";
import { exportarCandidaturasCommand } from "./commands/exportar-candidaturas";
import { relatorioCandidaturasCommand } from "./commands/relatorio-candidaturas";
import { handleReady } from "./events/ready";
import handleDashboardInteraction from "./events/interaction-create";
import { handleApplicationStatusButton } from "./interactions/application-status-buttons";

type BotCommand = {
  data: {
    name: string;
  };
  execute: (interaction: any) => Promise<void>;
};

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
}) as Client & {
  commands: Collection<string, BotCommand>;
};

client.commands = new Collection<string, BotCommand>();

client.commands.set(pingCommand.data.name, pingCommand);
client.commands.set(
  exportarCandidaturasCommand.data.name,
  exportarCandidaturasCommand,
);
client.commands.set(
  relatorioCandidaturasCommand.data.name,
  relatorioCandidaturasCommand,
);

client.once(Events.ClientReady, async (readyClient) => {
  await handleReady(readyClient);
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (interaction.isButton()) {
    try {
      const handled = await handleApplicationStatusButton(interaction);
      if (handled) return;

      await handleDashboardInteraction(interaction);
      return;
    } catch (error) {
      console.error("Erro ao processar botão:", error);

      if (interaction.isRepliable()) {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "Erro ao processar o botão.",
            flags: 64,
          });
        } else {
          await interaction.reply({
            content: "Erro ao processar o botão.",
            flags: 64,
          });
        }
      }

      return;
    }
  }

  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error("Erro ao executar comando:", error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "Ocorreu um erro ao executar este comando.",
          flags: 64,
        });
      } else {
        await interaction.reply({
          content: "Ocorreu um erro ao executar este comando.",
          flags: 64,
        });
      }
    }

    return;
  }

  if (
    interaction.isStringSelectMenu() ||
    interaction.isChannelSelectMenu() ||
    interaction.isRoleSelectMenu() ||
    interaction.isModalSubmit()
  ) {
    try {
      await handleDashboardInteraction(interaction);
    } catch (error) {
      console.error("Erro ao processar interação da dashboard:", error);

      if (interaction.isRepliable()) {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "Erro ao processar a dashboard.",
            flags: 64,
          });
        } else {
          await interaction.reply({
            content: "Erro ao processar a dashboard.",
            flags: 64,
          });
        }
      }
    }
  }
});

client.login(env.DISCORD_BOT_TOKEN);