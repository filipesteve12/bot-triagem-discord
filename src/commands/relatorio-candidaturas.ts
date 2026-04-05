import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { buildApplicationsReport } from "../dashboard/applications.report";

export const relatorioCandidaturasCommand = {
  data: new SlashCommandBuilder()
    .setName("relatorio-candidaturas")
    .setDescription("Mostra um resumo das candidaturas do servidor"),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      await interaction.reply({
        content: "Este comando só pode ser usado dentro de um servidor.",
        flags: 64,
      });
      return;
    }

    const report = buildApplicationsReport(interaction.guildId);

    if (report.total === 0) {
      await interaction.reply({
        content: "Nenhuma candidatura encontrada para gerar relatório.",
        flags: 64,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Relatório de candidaturas")
      .setDescription(
        `Resumo atual das candidaturas do servidor **${interaction.guild?.name ?? "Servidor"}**.`,
      )
      .addFields(
        { name: "Total", value: String(report.total), inline: true },
        { name: "Pendentes", value: String(report.pendente), inline: true },
        {
          name: "Em entrevista",
          value: String(report.emEntrevista),
          inline: true,
        },
        {
          name: "Revisão solicitada",
          value: String(report.revisaoSolicitada),
          inline: true,
        },
        { name: "Aprovadas", value: String(report.aprovado), inline: true },
        { name: "Reprovadas", value: String(report.reprovado), inline: true },
      )
      .setFooter({
        text: `Atualizado em ${new Date().toLocaleString("pt-BR")}`,
      });

    await interaction.reply({
      embeds: [embed],
      flags: 64,
    });
  },
};