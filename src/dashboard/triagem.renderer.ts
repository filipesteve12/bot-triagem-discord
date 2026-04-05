import {
  ActionRowBuilder,
  ChannelType,
  ChannelSelectMenuBuilder,
  EmbedBuilder,
  RoleSelectMenuBuilder,
} from "discord.js";
import type { TriagemConfig } from "./triagem.state";

export const TRIAGEM_IDS = {
  CHANNEL_SELECT: "triagem:channel-select",
  STAFF_CHANNEL_SELECT: "triagem:staff-channel-select",
  CONSCRITO_ROLE_SELECT: "triagem:conscrito-role-select",
  RECRUTA_ROLE_SELECT: "triagem:recruta-role-select",
} as const;

function formatChannel(value: string | null) {
  return value ? `<#${value}>` : "`Não configurado`";
}

function formatRole(value: string | null) {
  return value ? `<@&${value}>` : "`Não configurado`";
}

function getStatus(config: TriagemConfig) {
  const isComplete =
    !!config.triagemChannelId &&
    !!config.staffChannelId &&
    !!config.conscritoRoleId &&
    !!config.recrutaRoleId;

  return isComplete
    ? "🟢 Configuração básica concluída"
    : "🟡 Configuração incompleta";
}

function getPublicationStatus(config: TriagemConfig) {
  return config.publishedRecruitmentMessageId
    ? "🟢 Painel de recrutamento publicado"
    : "⚪ Painel ainda não publicado";
}

export function renderTriagemSection(config: TriagemConfig) {
  const embed = new EmbedBuilder()
    .setColor(0x1f6feb)
    .setTitle("Dashboard • Triagem")
    .setDescription("Configure o fluxo inicial de recrutamento do servidor.")
    .addFields(
      {
        name: "Status",
        value: getStatus(config),
        inline: false,
      },
      {
        name: "Painel público",
        value: getPublicationStatus(config),
        inline: false,
      },
      {
        name: "Canal de triagem",
        value: formatChannel(config.triagemChannelId),
        inline: false,
      },
      {
        name: "Canal staff",
        value: formatChannel(config.staffChannelId),
        inline: false,
      },
      {
        name: "Cargo de Conscrito",
        value: formatRole(config.conscritoRoleId),
        inline: true,
      },
      {
        name: "Cargo de Recruta",
        value: formatRole(config.recrutaRoleId),
        inline: true,
      },
    )
    .setTimestamp();

  const triagemChannelRow =
    new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(TRIAGEM_IDS.CHANNEL_SELECT)
        .setPlaceholder("Selecionar canal de triagem")
        .setMinValues(1)
        .setMaxValues(1)
        .addChannelTypes(ChannelType.GuildText)
        .setDefaultChannels(
          ...(config.triagemChannelId ? [config.triagemChannelId] : []),
        ),
    );

  const staffChannelRow =
    new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(TRIAGEM_IDS.STAFF_CHANNEL_SELECT)
        .setPlaceholder("Selecionar canal staff para receber fichas")
        .setMinValues(1)
        .setMaxValues(1)
        .addChannelTypes(ChannelType.GuildText)
        .setDefaultChannels(
          ...(config.staffChannelId ? [config.staffChannelId] : []),
        ),
    );

  const conscritoRow =
    new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId(TRIAGEM_IDS.CONSCRITO_ROLE_SELECT)
        .setPlaceholder("Selecionar cargo de Conscrito")
        .setMinValues(1)
        .setMaxValues(1)
        .setDefaultRoles(
          ...(config.conscritoRoleId ? [config.conscritoRoleId] : []),
        ),
    );

  const recrutaRow =
    new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId(TRIAGEM_IDS.RECRUTA_ROLE_SELECT)
        .setPlaceholder("Selecionar cargo de Recruta")
        .setMinValues(1)
        .setMaxValues(1)
        .setDefaultRoles(
          ...(config.recrutaRoleId ? [config.recrutaRoleId] : []),
        ),
    );

  return {
    embed,
    extraComponents: [
      triagemChannelRow,
      staffChannelRow,
      conscritoRow,
      recrutaRow,
    ],
  };
}