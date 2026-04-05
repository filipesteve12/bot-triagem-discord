import type {
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  Interaction,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
} from "discord.js";
import { DASHBOARD_IDS } from "../dashboard/dashboard.constants";
import { renderDashboard } from "../dashboard/dashboard.renderer";
import {
  handleRecruitmentDecision,
  handleRecruitmentModalSubmit,
  publishRecruitmentPanel,
  RECRUITMENT_IDS,
  showRecruitmentModal,
} from "../dashboard/recruitment-panel";
import { TRIAGEM_IDS } from "../dashboard/triagem.renderer";
import { updateTriagemConfig } from "../dashboard/triagem.state";
import type { DashboardView } from "../dashboard/dashboard.types";

async function handleDashboardInteraction(interaction: Interaction) {
  if (interaction.isModalSubmit()) {
    const handled = await handleRecruitmentModalSubmit(interaction);
    if (handled) return;
  }

  if (interaction.isStringSelectMenu()) {
    await handleStringSelect(interaction);
    return;
  }

  if (interaction.isChannelSelectMenu()) {
    await handleChannelSelect(interaction);
    return;
  }

  if (interaction.isRoleSelectMenu()) {
    await handleRoleSelect(interaction);
    return;
  }

  if (interaction.isButton()) {
    await handleButton(interaction);
  }
}

async function handleStringSelect(interaction: StringSelectMenuInteraction) {
  if (interaction.customId !== DASHBOARD_IDS.MAIN_MENU) return;

  const selectedView = interaction.values[0] as DashboardView;
  await interaction.update(
    renderDashboard(selectedView, interaction.guildId ?? undefined),
  );
}

async function handleChannelSelect(interaction: ChannelSelectMenuInteraction) {
  if (!interaction.guildId) return;

  const selectedChannelId = interaction.values[0];

  if (interaction.customId === TRIAGEM_IDS.CHANNEL_SELECT) {
    await updateTriagemConfig(interaction.guildId, {
      triagemChannelId: selectedChannelId,
    });

    await interaction.update(renderDashboard("triagem", interaction.guildId));
    return;
  }

  if (interaction.customId === TRIAGEM_IDS.STAFF_CHANNEL_SELECT) {
    await updateTriagemConfig(interaction.guildId, {
      staffChannelId: selectedChannelId,
    });

    await interaction.update(renderDashboard("triagem", interaction.guildId));
  }
}

async function handleRoleSelect(interaction: RoleSelectMenuInteraction) {
  if (!interaction.guildId) return;

  const selectedRoleId = interaction.values[0];

  if (interaction.customId === TRIAGEM_IDS.CONSCRITO_ROLE_SELECT) {
    await updateTriagemConfig(interaction.guildId, {
      conscritoRoleId: selectedRoleId,
    });

    await interaction.update(renderDashboard("triagem", interaction.guildId));
    return;
  }

  if (interaction.customId === TRIAGEM_IDS.RECRUTA_ROLE_SELECT) {
    await updateTriagemConfig(interaction.guildId, {
      recrutaRoleId: selectedRoleId,
    });

    await interaction.update(renderDashboard("triagem", interaction.guildId));
  }
}

async function handleButton(interaction: ButtonInteraction) {
  const handledDecision = await handleRecruitmentDecision(interaction);
  if (handledDecision) return;

  if (interaction.customId === DASHBOARD_IDS.HOME) {
    await interaction.update(
      renderDashboard("home", interaction.guildId ?? undefined),
    );
    return;
  }

  if (interaction.customId === DASHBOARD_IDS.REFRESH) {
    const currentTitle = interaction.message.embeds[0]?.title ?? "";
    const view = inferViewFromTitle(currentTitle);

    await interaction.update(
      renderDashboard(view, interaction.guildId ?? undefined),
    );
    return;
  }

  if (interaction.customId === DASHBOARD_IDS.SETTINGS) {
    await interaction.update(
      renderDashboard("config", interaction.guildId ?? undefined),
    );
    return;
  }

  if (interaction.customId === DASHBOARD_IDS.PUBLISH_TRIAGEM_PANEL) {
    if (!interaction.guildId) return;

    await publishRecruitmentPanel(interaction.client, interaction.guildId);
    await interaction.update(renderDashboard("triagem", interaction.guildId));
    return;
  }

  if (interaction.customId === RECRUITMENT_IDS.START_RECRUITMENT) {
    await showRecruitmentModal(interaction);
  }
}

function inferViewFromTitle(title: string): DashboardView {
  if (title.includes("Triagem")) return "triagem";
  if (title.includes("Tickets")) return "tickets";
  if (title.includes("Embeds")) return "embeds";
  if (title.includes("Configurações")) return "config";
  return "home";
}

export default handleDashboardInteraction;