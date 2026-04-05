import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { buildApplicationsCsv } from "../dashboard/applications.export";
import {
  listApplicationsByGuild,
  type ApplicationStatus,
} from "../dashboard/applications.store";

export const exportarCandidaturasCommand = {
  data: new SlashCommandBuilder()
    .setName("exportar-candidaturas")
    .setDescription("Exporta as candidaturas do servidor em CSV")
    .addStringOption((option) =>
      option
        .setName("status")
        .setDescription("Filtrar por status da candidatura")
        .setRequired(false)
        .addChoices(
          { name: "Todos", value: "TODOS" },
          { name: "Pendente", value: "Pendente" },
          { name: "Em entrevista", value: "Em entrevista" },
          { name: "Revisão solicitada", value: "Revisão solicitada" },
          { name: "Aprovado", value: "Aprovado" },
          { name: "Reprovado", value: "Reprovado" },
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      await interaction.reply({
        content: "Este comando só pode ser usado dentro de um servidor.",
        flags: 64,
      });
      return;
    }

    const rawStatus = interaction.options.getString("status");
    const status =
      rawStatus && rawStatus !== "TODOS"
        ? (rawStatus as ApplicationStatus)
        : undefined;

    const applications = listApplicationsByGuild(interaction.guildId).filter(
      (application) => (status ? application.statusAtual === status : true),
    );

    if (applications.length === 0) {
      await interaction.reply({
        content: status
          ? `Nenhuma candidatura encontrada com status "${status}".`
          : "Nenhuma candidatura encontrada para exportar.",
        flags: 64,
      });
      return;
    }

    const csvBuffer = buildApplicationsCsv(interaction.guildId, status);

    const suffix = status
      ? status
          .toLowerCase()
          .replaceAll(" ", "-")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
      : "todos";

    const attachment = new AttachmentBuilder(csvBuffer, {
      name: `candidaturas-${suffix}.csv`,
      description: "Exportação CSV das candidaturas",
    });

    await interaction.reply({
      content: status
        ? `Exportação concluída para o status "${status}". Total: ${applications.length}.`
        : `Exportação concluída. Total de candidaturas: ${applications.length}.`,
      files: [attachment],
      flags: 64,
    });
  },
};