import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import type {
  ApplicationStatus,
  RecruitmentApplication,
} from "./applications.store";

export function buildApplicationStaffEmbed(
  application: RecruitmentApplication,
) {
  return new EmbedBuilder()
    .setColor(getStatusColor(application.statusAtual))
    .setTitle("Candidatura")
    .setDescription(`Candidatura de <@${application.userId}>`)
    .addFields(
      { name: "Usuário", value: safeInline(application.userTag), inline: true },
      { name: "Nick no jogo", value: safeInline(application.nickJogo), inline: true },
      { name: "Idade", value: safeInline(application.idade), inline: true },
      { name: "Status", value: safeInline(application.statusAtual), inline: true },
      { name: "Experiência", value: safeBlock(application.experiencia), inline: false },
      { name: "Disponibilidade", value: safeBlock(application.disponibilidade), inline: false },
      { name: "Motivo da staff", value: safeBlock(application.motivoStaff), inline: false },
      { name: "Última revisão por", value: safeInline(application.reviewedByTag), inline: true },
    )
    .setFooter({
      text: `Criada em ${formatPtBr(application.createdAt)} • Atualizada em ${formatPtBr(application.updatedAt)}`,
    });
}

export function buildApplicationStaffComponents(
  application: RecruitmentApplication,
) {
  const isPending = application.statusAtual === "Pendente";
  const isApproved = application.statusAtual === "Aprovado";
  const isRejected = application.statusAtual === "Reprovado";
  const isInterview = application.statusAtual === "Em entrevista";
  const isReview = application.statusAtual === "Revisão solicitada";
  const isFinished = isApproved || isRejected;

  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`application:interview:${application.id}`)
        .setLabel("Marcar entrevista")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(isInterview || isFinished),
      new ButtonBuilder()
        .setCustomId(`application:review:${application.id}`)
        .setLabel("Pedir revisão")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(isReview || isFinished),
      new ButtonBuilder()
        .setCustomId(`application:approve:${application.id}`)
        .setLabel("Aprovar")
        .setStyle(ButtonStyle.Success)
        .setDisabled(isApproved || isFinished),
      new ButtonBuilder()
        .setCustomId(`application:reject:${application.id}`)
        .setLabel("Reprovar")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(isRejected || isFinished),
      new ButtonBuilder()
        .setCustomId(`application:reopen:${application.id}`)
        .setLabel("Reabrir")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(isPending),
    ),
  ];
}

function getStatusColor(status: ApplicationStatus) {
  switch (status) {
    case "Aprovado":
      return 0x57f287;
    case "Reprovado":
      return 0xed4245;
    case "Em entrevista":
      return 0x5865f2;
    case "Revisão solicitada":
      return 0xfee75c;
    case "Pendente":
    default:
      return 0x2b2d31;
  }
}

function safeInline(value: string | null | undefined) {
  const normalized = normalizeText(value);
  return truncateField(normalized || "Não informado.", 1024);
}

function safeBlock(value: string | null | undefined) {
  const normalized = normalizeText(value);
  return truncateField(normalized || "Não informado.", 1024);
}

function normalizeText(value: string | null | undefined) {
  if (!value) return "";
  return value.trim();
}

function truncateField(value: string, max = 1024) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

function formatPtBr(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data inválida";
  }

  return date.toLocaleString("pt-BR");
}