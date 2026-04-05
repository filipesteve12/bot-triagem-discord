import { REST, Routes } from "discord.js";
import { env } from "./config/env";
import { pingCommand } from "./commands/ping";
import { exportarCandidaturasCommand } from "./commands/exportar-candidaturas";
import { relatorioCandidaturasCommand } from "./commands/relatorio-candidaturas";

const commands = [
  pingCommand.data.toJSON(),
  exportarCandidaturasCommand.data.toJSON(),
  relatorioCandidaturasCommand.data.toJSON(),
];

const rest = new REST({ version: "10" }).setToken(env.DISCORD_BOT_TOKEN);

async function deployCommands() {
  try {
    console.log("Atualizando slash commands...");

    await rest.put(
      Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID),
      { body: commands },
    );

    console.log("Slash commands atualizados com sucesso.");
  } catch (error) {
    console.error("Erro ao atualizar slash commands:", error);
  }
}

deployCommands();