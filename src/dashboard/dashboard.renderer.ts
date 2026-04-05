import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import type { DashboardView } from "./dashboard.types";
import { DASHBOARD_IDS, DASHBOARD_MARKER } from "./dashboard.constants";
import { getTriagemConfig } from "./triagem.state";
import { renderTriagemSection } from "./triagem.renderer";

function getDefaultContent(view: DashboardView) {
  switch (view) {
    case "tickets":
      return {
        title: "Dashboard • Tickets",
        description:
          "Gerencie canais privados entre staff e membros, com criação, atualização e encerramento.",
        fields: [
          {
            name: "Ações previstas",
            value:
              "• Configurar categoria de tickets\n• Criar canal privado\n• Adicionar participantes\n• Fechar ticket",
          },
        ],
      };

    case "embeds":
      return {
        title: "Dashboard • Embeds",
        description:
          "Monte mensagens ricas com título, descrição, cor, thumbnail, imagem, botões e publicação.",
        fields: [
          {
            name: "Ações previstas",
            value:
              "• Criar template\n• Editar embed\n• Escolher canal de envio\n• Publicar mensagem",
          },
        ],
      };

    case "config":
      return {
        title: "Dashboard • Configurações",
        description:
          "Ajuste os parâmetros principais do bot, canais-base, cargos padrão e módulos habilitados.",
        fields: [
          {
            name: "Ações previstas",
            value:
              "• Canal do dashboard\n• Canais do sistema\n• Cargos padrão\n• Status dos módulos",
          },
        ],
      };

    case "home":
    default:
      return {
        title: "Central Operacional do Clã",
        description:
          "Painel principal do bot. Use o menu abaixo para navegar entre Triagem, Tickets, Embeds e Configurações.",
        fields: [
          {
            name: "Módulos",
            value:
              "• Triagem\n• Tickets\n• Embeds\n• Configurações",
          },
          {
            name: "Status",
            value:
              "• Bot online\n• Painel persistente ativo\n• Pronto para configuração",
          },
        ],
      };
  }
}

export function renderDashboard(view: DashboardView = "home", guildId?: string) {
  let embed: EmbedBuilder;
  let extraComponents: any[] = [];

  if (view === "triagem" && guildId) {
    const triagem = renderTriagemSection(getTriagemConfig(guildId));
    embed = triagem.embed.setFooter({ text: DASHBOARD_MARKER });
    extraComponents = triagem.extraComponents;
  } else {
    const content = getDefaultContent(view);

    embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle(content.title)
      .setDescription(content.description)
      .addFields(content.fields)
      .setFooter({ text: DASHBOARD_MARKER })
      .setTimestamp();
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId(DASHBOARD_IDS.MAIN_MENU)
    .setPlaceholder("Escolha um módulo")
    .addOptions([
      {
        label: "Início",
        value: "home",
        description: "Voltar para o painel principal",
        default: view === "home",
      },
      {
        label: "Triagem",
        value: "triagem",
        description: "Configurar fluxo de recrutamento",
        default: view === "triagem",
      },
      {
        label: "Tickets",
        value: "tickets",
        description: "Gerenciar canais privados",
        default: view === "tickets",
      },
      {
        label: "Embeds",
        value: "embeds",
        description: "Criar mensagens personalizadas",
        default: view === "embeds",
      },
      {
        label: "Configurações",
        value: "config",
        description: "Ajustar parâmetros do sistema",
        default: view === "config",
      },
    ]);

  const menuRow =
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);

  const defaultButtonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(DASHBOARD_IDS.HOME)
      .setLabel("Início")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(DASHBOARD_IDS.REFRESH)
      .setLabel("Atualizar")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(DASHBOARD_IDS.SETTINGS)
      .setLabel("Configurações")
      .setStyle(ButtonStyle.Secondary),
  );

  const triagemButtonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(DASHBOARD_IDS.HOME)
      .setLabel("Início")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(DASHBOARD_IDS.REFRESH)
      .setLabel("Atualizar")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(DASHBOARD_IDS.PUBLISH_TRIAGEM_PANEL)
      .setLabel("Publicar painel")
      .setStyle(ButtonStyle.Success),
  );

  const components =
    view === "triagem"
      ? [triagemButtonsRow, ...extraComponents]
      : [menuRow, defaultButtonsRow, ...extraComponents];

  return {
    embeds: [embed],
    components,
  };
}