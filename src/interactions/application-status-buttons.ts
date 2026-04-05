import type { ButtonInteraction } from "discord.js";
import {
  buildApplicationStaffComponents,
  buildApplicationStaffEmbed,
} from "../dashboard/applications.staff-card";
import {
  getApplicationById,
  updateApplicationDecision,
  type ApplicationStatus,
} from "../dashboard/applications.store";

const actionToStatus: Record<string, ApplicationStatus> = {
  interview: "Em entrevista",
  review: "Revisão solicitada",
  approve: "Aprovado",
  reject: "Reprovado",
  reopen: "Pendente",
};

export async function handleApplicationStatusButton(
  interaction: ButtonInteraction,
) {
  if (!interaction.customId.startsWith("application:")) {
    return false;
  }

  console.log("[application button] customId =", interaction.customId);

  try {
    const [, action, applicationId] = interaction.customId.split(":");

    if (!action || !applicationId) {
      await interaction.reply({
        content: "Botão inválido.",
        flags: 64,
      });
      return true;
    }

    const nextStatus = actionToStatus[action];

    if (!nextStatus) {
      await interaction.reply({
        content: "Ação de botão não reconhecida.",
        flags: 64,
      });
      return true;
    }

    const existingApplication = getApplicationById(applicationId);

    if (!existingApplication) {
      await interaction.reply({
        content: "Candidatura não encontrada.",
        flags: 64,
      });
      return true;
    }

    const reason =
      action === "reopen"
        ? `Candidatura reaberta por ${interaction.user.tag}.`
        : `Status alterado para "${nextStatus}" por ${interaction.user.tag}.`;

    const updatedApplication = await updateApplicationDecision({
      applicationId,
      statusAtual: nextStatus,
      reviewedById: interaction.user.id,
      reviewedByTag: interaction.user.tag,
      motivoStaff: reason,
    });

    await interaction.update({
      embeds: [buildApplicationStaffEmbed(updatedApplication)],
      components: buildApplicationStaffComponents(updatedApplication),
    });

    return true;
  } catch (error) {
    console.error("Erro no botão da candidatura:", error);

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "Erro ao atualizar a candidatura.",
          flags: 64,
        });
      } else {
        await interaction.reply({
          content: "Erro ao atualizar a candidatura.",
          flags: 64,
        });
      }
    } catch (replyError) {
      console.error("Erro ao responder a interação:", replyError);
    }

    return true;
  }
}