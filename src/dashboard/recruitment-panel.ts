import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  Client,
  EmbedBuilder,
  Message,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import {
  attachStaffMessageToApplication,
  createApplication,
  getApplicationById,
  type ApplicationStatus,
  type RecruitmentApplication,
  updateApplicationDecision,
} from "./applications.store";
import { getTriagemConfig, updateTriagemConfig } from "./triagem.state";

export const RECRUITMENT_IDS = {
  START_RECRUITMENT: "triagem:start-recruitment",
  MODAL: "triagem:recruitment-modal",
  FIELD_NICK: "triagem:field-nick",
  FIELD_IDADE: "triagem:field-idade",
  FIELD_EXPERIENCIA: "triagem:field-experiencia",
  FIELD_DISPONIBILIDADE: "triagem:field-disponibilidade",
  FIELD_REASON: "triagem:field-reason",
  INTERVIEW_PREFIX: "triagem:interview:",
  REVIEW_PREFIX: "triagem:review:",
  APPROVE_PREFIX: "triagem:approve:",
  REJECT_PREFIX: "triagem:reject:",
  REOPEN_PREFIX: "triagem:reopen:",
  REVIEW_MODAL_PREFIX: "triagem:review-modal",
  REJECT_MODAL_PREFIX: "triagem:reject-modal",
} as const;

function renderRecruitmentPanel() {
  const embed = new EmbedBuilder()
    .setColor(0x3b7d3a)
    .setTitle("Recrutamento do Clã")
    .setDescription(
      "Bem-vindo ao processo de recrutamento.\n\nClique no botão abaixo para iniciar sua inscrição.",
    )
    .addFields(
      {
        name: "Como funciona",
        value:
          "1. Clique em iniciar\n2. Preencha as informações\n3. Aguarde a análise da staff",
      },
      {
        name: "Importante",
        value:
          "Preencha tudo com atenção. Informações incorretas podem atrasar sua análise.",
      },
    )
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(RECRUITMENT_IDS.START_RECRUITMENT)
      .setLabel("Iniciar recrutamento")
      .setStyle(ButtonStyle.Success),
  );

  return {
    embeds: [embed],
    components: [row],
  };
}

function buildStaffDecisionRow(application: RecruitmentApplication) {
  const isPending = application.statusAtual === "Pendente";
  const isApproved = application.statusAtual === "Aprovado";
  const isRejected = application.statusAtual === "Reprovado";
  const isInterview = application.statusAtual === "Em entrevista";
  const isReview = application.statusAtual === "Revisão solicitada";
  const isFinished = isApproved || isRejected;

  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(
        `${RECRUITMENT_IDS.INTERVIEW_PREFIX}${application.id}:${application.userId}`,
      )
      .setLabel("Entrevista")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(isInterview || isFinished),
    new ButtonBuilder()
      .setCustomId(
        `${RECRUITMENT_IDS.REVIEW_PREFIX}${application.id}:${application.userId}`,
      )
      .setLabel("Pedir revisão")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(isReview || isFinished),
    new ButtonBuilder()
      .setCustomId(
        `${RECRUITMENT_IDS.APPROVE_PREFIX}${application.id}:${application.userId}`,
      )
      .setLabel("Aprovar")
      .setStyle(ButtonStyle.Success)
      .setDisabled(isApproved || isFinished),
    new ButtonBuilder()
      .setCustomId(
        `${RECRUITMENT_IDS.REJECT_PREFIX}${application.id}:${application.userId}`,
      )
      .setLabel("Reprovar")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(isRejected || isFinished),
    new ButtonBuilder()
      .setCustomId(
        `${RECRUITMENT_IDS.REOPEN_PREFIX}${application.id}:${application.userId}`,
      )
      .setLabel("Reabrir")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(isPending),
  );
}

function getStatusColor(status: ApplicationStatus) {
  if (status === "Aprovado") return 0x22c55e;
  if (status === "Reprovado") return 0xef4444;
  if (status === "Em entrevista") return 0x3b82f6;
  if (status === "Revisão solicitada") return 0xf59e0b;
  return 0xeab308;
}

function buildApplicationEmbed(application: RecruitmentApplication) {
  const embed = new EmbedBuilder()
    .setColor(getStatusColor(application.statusAtual))
    .setTitle("Ficha de recrutamento")
    .setDescription(`Candidato: <@${application.userId}>`)
    .addFields(
      { name: "Usuário", value: application.userTag, inline: true },
      { name: "ID Discord", value: application.userId, inline: true },
      { name: "ID da candidatura", value: application.id, inline: false },
      { name: "Nick no jogo", value: application.nickJogo, inline: false },
      { name: "Idade", value: application.idade, inline: true },
      { name: "Experiência", value: application.experiencia, inline: false },
      { name: "Disponibilidade", value: application.disponibilidade, inline: false },
      { name: "Status", value: application.statusAtual, inline: true },
    )
    .setFooter({
      text: `Application ${application.id} • Candidate ${application.userId}`,
    })
    .setTimestamp(new Date(application.updatedAt));

  if (application.motivoStaff) {
    embed.addFields({
      name: "Motivo da staff",
      value: application.motivoStaff,
      inline: false,
    });
  }

  if (application.reviewedByTag) {
    embed.addFields({
      name: "Última revisão por",
      value: application.reviewedByTag,
      inline: true,
    });
  }

  return embed;
}

async function notifyCandidate(
  interaction: ButtonInteraction | ModalSubmitInteraction,
  targetUserId: string,
  status: ApplicationStatus,
  reason?: string | null,
) {
  try {
    const targetUser = await interaction.client.users.fetch(targetUserId);

    let content = "";

    if (status === "Em entrevista") {
      content =
        "Sua ficha avançou para a etapa de entrevista. Fique atento ao servidor e às mensagens da staff.";
    } else if (status === "Revisão solicitada") {
      content = reason
        ? `Sua ficha entrou em revisão.\n\nMotivo informado pela staff:\n${reason}`
        : "Sua ficha entrou em revisão. A staff pode entrar em contato para ajustes ou informações adicionais.";
    } else if (status === "Aprovado") {
      content =
        "Sua ficha foi aprovada. Você agora faz parte da próxima etapa do recrutamento.";
    } else if (status === "Reprovado") {
      content = reason
        ? `Sua ficha foi reprovada nesta etapa.\n\nMotivo informado pela staff:\n${reason}`
        : "Sua ficha foi reprovada nesta etapa. Procure a staff se precisar de mais informações.";
    } else if (status === "Pendente") {
      content =
        "Sua candidatura foi reaberta e voltou para o status pendente. Aguarde nova análise da staff.";
    }

    if (content) {
      await targetUser.send(content);
    }
  } catch (error) {
    console.error("Não foi possível enviar DM ao candidato:", error);
  }
}

function createReasonModal(
  customId: string,
  title: string,
  label: string,
  placeholder: string,
) {
  const modal = new ModalBuilder().setCustomId(customId).setTitle(title);

  const reasonInput = new TextInputBuilder()
    .setCustomId(RECRUITMENT_IDS.FIELD_REASON)
    .setLabel(label)
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(700)
    .setPlaceholder(placeholder);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput),
  );

  return modal;
}

function parseActionCustomId(customId: string) {
  const parts = customId.split(":");
  if (parts.length < 4) return null;
  if (parts[0] !== "triagem") return null;

  const action = parts[1];
  const applicationId = parts[2];
  const userId = parts[3];

  if (!action || !applicationId || !userId) return null;

  return { action, applicationId, userId };
}

function parseStaffModalCustomId(customId: string) {
  const parts = customId.split(":");
  if (parts.length < 4) return null;
  if (parts[0] !== "triagem") return null;

  const modalType = parts[1];
  const applicationId = parts[2];
  const userId = parts[3];

  if (!modalType || !applicationId || !userId) return null;

  if (modalType === "review-modal") {
    return {
      status: "Revisão solicitada" as ApplicationStatus,
      finalizes: false,
      applicationId,
      userId,
    };
  }

  if (modalType === "reject-modal") {
    return {
      status: "Reprovado" as ApplicationStatus,
      finalizes: true,
      applicationId,
      userId,
    };
  }

  return null;
}

async function memberHasAnyAllowedRole(
  interaction: ButtonInteraction | ModalSubmitInteraction,
  roleIds: string[],
) {
  if (!interaction.guild) return false;

  const member = await interaction.guild.members.fetch(interaction.user.id);
  return roleIds.some((roleId) => member.roles.cache.has(roleId));
}

async function editStaffApplicationMessage(
  interaction: ButtonInteraction | ModalSubmitInteraction,
  application: RecruitmentApplication,
) {
  if (!application.staffChannelId || !application.staffMessageId) {
    throw new Error("Mensagem da staff não vinculada à candidatura");
  }

  const channel = await interaction.client.channels.fetch(application.staffChannelId);

  if (!channel || channel.type !== ChannelType.GuildText) {
    throw new Error("Canal da staff inválido");
  }

  const message = await channel.messages.fetch(application.staffMessageId);

  await message.edit({
    embeds: [buildApplicationEmbed(application)],
    components: [buildStaffDecisionRow(application)],
  });
}

export async function publishRecruitmentPanel(
  client: Client,
  guildId: string,
): Promise<Message> {
  const config = getTriagemConfig(guildId);

  if (!config.triagemChannelId) {
    throw new Error("Canal de triagem não configurado");
  }

  const channel = await client.channels.fetch(config.triagemChannelId);

  if (!channel || channel.type !== ChannelType.GuildText) {
    throw new Error("Canal de triagem inválido");
  }

  const payload = renderRecruitmentPanel();

  if (
    config.publishedRecruitmentChannelId === channel.id &&
    config.publishedRecruitmentMessageId
  ) {
    try {
      const existingMessage = await channel.messages.fetch(
        config.publishedRecruitmentMessageId,
      );

      await existingMessage.edit(payload);
      return existingMessage;
    } catch {}
  }

  const message = await channel.send(payload);

  await updateTriagemConfig(guildId, {
    publishedRecruitmentChannelId: channel.id,
    publishedRecruitmentMessageId: message.id,
  });

  return message;
}

export async function showRecruitmentModal(interaction: ButtonInteraction) {
  const modal = new ModalBuilder()
    .setCustomId(RECRUITMENT_IDS.MODAL)
    .setTitle("Ficha de recrutamento");

  const nickInput = new TextInputBuilder()
    .setCustomId(RECRUITMENT_IDS.FIELD_NICK)
    .setLabel("Seu nick no jogo")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(50);

  const idadeInput = new TextInputBuilder()
    .setCustomId(RECRUITMENT_IDS.FIELD_IDADE)
    .setLabel("Sua idade")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(3);

  const experienciaInput = new TextInputBuilder()
    .setCustomId(RECRUITMENT_IDS.FIELD_EXPERIENCIA)
    .setLabel("Experiência no jogo")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(500);

  const disponibilidadeInput = new TextInputBuilder()
    .setCustomId(RECRUITMENT_IDS.FIELD_DISPONIBILIDADE)
    .setLabel("Dias e horários disponíveis")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(500);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(nickInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(idadeInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(experienciaInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(disponibilidadeInput),
  );

  await interaction.showModal(modal);
}

export async function handleRecruitmentModalSubmit(
  interaction: ModalSubmitInteraction,
) {
  if (interaction.customId === RECRUITMENT_IDS.MODAL) {
    if (!interaction.guildId || !interaction.guild) return true;

    const config = getTriagemConfig(interaction.guildId);

    if (!config.staffChannelId) {
      await interaction.reply({
        content: "Canal staff não configurado.",
        flags: 64,
      });
      return true;
    }

    const staffChannel = await interaction.client.channels.fetch(
      config.staffChannelId,
    );

    if (!staffChannel || staffChannel.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: "Canal staff inválido.",
        flags: 64,
      });
      return true;
    }

    const nick = interaction.fields.getTextInputValue(RECRUITMENT_IDS.FIELD_NICK);
    const idade = interaction.fields.getTextInputValue(RECRUITMENT_IDS.FIELD_IDADE);
    const experiencia = interaction.fields.getTextInputValue(
      RECRUITMENT_IDS.FIELD_EXPERIENCIA,
    );
    const disponibilidade = interaction.fields.getTextInputValue(
      RECRUITMENT_IDS.FIELD_DISPONIBILIDADE,
    );

    const application = await createApplication({
      guildId: interaction.guildId,
      userId: interaction.user.id,
      userTag: interaction.user.tag,
      nickJogo: nick,
      idade,
      experiencia,
      disponibilidade,
    });

    const staffMessage = await staffChannel.send({
      embeds: [buildApplicationEmbed(application)],
      components: [buildStaffDecisionRow(application)],
    });

    await attachStaffMessageToApplication({
      applicationId: application.id,
      staffChannelId: staffChannel.id,
      staffMessageId: staffMessage.id,
    });

    if (config.conscritoRoleId) {
      try {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        await member.roles.add(config.conscritoRoleId);
      } catch (error) {
        console.error("Não foi possível adicionar o cargo de conscrito:", error);
      }
    }

    await interaction.reply({
      content:
        "Sua ficha foi enviada para a staff com sucesso. Aguarde a análise.",
      flags: 64,
    });

    return true;
  }

  const parsed = parseStaffModalCustomId(interaction.customId);
  if (!parsed) return false;
  if (!interaction.guildId || !interaction.guild) return true;
  
  const config = getTriagemConfig(interaction.guildId);

  const allowedRoleIds = [
    config.staffRoleId,
    config.liderRoleId,
    config.subLiderRoleId,
  ].filter((roleId): roleId is string => Boolean(roleId));

  if (allowedRoleIds.length === 0) {
    await interaction.reply({
      content: "Nenhum cargo de staff foi configurado para essas ações.",
      flags: 64,
    });
    return true;
  }

  const hasPermission = await memberHasAnyAllowedRole(
    interaction,
    allowedRoleIds,
  );

  if (!hasPermission) {
    await interaction.reply({
      content: "Você não tem permissão para enviar esse modal.",
      flags: 64,
    });
    return true;
  }

  const application = getApplicationById(parsed.applicationId);

  if (!application) {
    await interaction.reply({
      content: "Candidatura não encontrada.",
      flags: 64,
    });
    return true;
  }

  const reason = interaction.fields.getTextInputValue(RECRUITMENT_IDS.FIELD_REASON);

  if (parsed.finalizes) {
    const config = getTriagemConfig(interaction.guildId);

    if (config.conscritoRoleId) {
      try {
        const member = await interaction.guild.members.fetch(parsed.userId);
        await member.roles.remove(config.conscritoRoleId);
      } catch {}
    }
  }

  const updatedApplication = await updateApplicationDecision({
    applicationId: parsed.applicationId,
    statusAtual: parsed.status,
    motivoStaff: reason,
    reviewedById: interaction.user.id,
    reviewedByTag: interaction.user.tag,
  });

  await editStaffApplicationMessage(interaction, updatedApplication);

  await notifyCandidate(interaction, parsed.userId, parsed.status, reason);

  await interaction.reply({
    content:
      parsed.status === "Revisão solicitada"
        ? "Revisão registrada com sucesso."
        : "Reprovação registrada com sucesso.",
    flags: 64,
  });

  return true;
}

export async function handleRecruitmentDecision(
  interaction: ButtonInteraction,
) {
  const parsed = parseActionCustomId(interaction.customId);
  if (!parsed) return false;
  if (!interaction.guildId || !interaction.guild) return true;

  const config = getTriagemConfig(interaction.guildId);

  const allowedRoleIds = [
    config.staffRoleId,
    config.liderRoleId,
    config.subLiderRoleId,
  ].filter((roleId): roleId is string => Boolean(roleId));

  if (allowedRoleIds.length === 0) {
    await interaction.reply({
      content: "Nenhum cargo de staff foi configurado para essas ações.",
      flags: 64,
    });
    return true;
  }

  const hasPermission = await memberHasAnyAllowedRole(
    interaction,
    allowedRoleIds,
  );

  if (!hasPermission) {
    await interaction.reply({
      content: "Você não tem permissão para usar esses botões.",
      flags: 64,
    });
    return true;
  }

  const application = getApplicationById(parsed.applicationId);

  if (!application) {
    await interaction.reply({
      content: "Candidatura não encontrada.",
      flags: 64,
    });
    return true;
  }

  if (parsed.action === "review") {
    const modal = createReasonModal(
      `${RECRUITMENT_IDS.REVIEW_MODAL_PREFIX}:${parsed.applicationId}:${parsed.userId}`,
      "Solicitar revisão",
      "Motivo da revisão",
      "Explique o que o candidato precisa corrigir ou complementar",
    );

    await interaction.showModal(modal);
    return true;
  }

  if (parsed.action === "reject") {
    const modal = createReasonModal(
      `${RECRUITMENT_IDS.REJECT_MODAL_PREFIX}:${parsed.applicationId}:${parsed.userId}`,
      "Reprovar candidatura",
      "Motivo da reprovação",
      "Explique por que a ficha foi reprovada",
    );

    await interaction.showModal(modal);
    return true;
  }

  if (parsed.action === "interview") {
    const updatedApplication = await updateApplicationDecision({
      applicationId: parsed.applicationId,
      statusAtual: "Em entrevista",
      motivoStaff: null,
      reviewedById: interaction.user.id,
      reviewedByTag: interaction.user.tag,
    });

    await interaction.update({
      embeds: [buildApplicationEmbed(updatedApplication)],
      components: [buildStaffDecisionRow(updatedApplication)],
    });

    await notifyCandidate(interaction, parsed.userId, "Em entrevista");
    return true;
  }

  if (parsed.action === "approve") {
    const config = getTriagemConfig(interaction.guildId);

    try {
      const member = await interaction.guild.members.fetch(parsed.userId);

      if (config.conscritoRoleId) {
        try {
          await member.roles.remove(config.conscritoRoleId);
        } catch {}
      }

      if (config.recrutaRoleId) {
        await member.roles.add(config.recrutaRoleId);
      }
    } catch (error) {
      console.error("Não foi possível atualizar os cargos do candidato:", error);
    }

    const updatedApplication = await updateApplicationDecision({
      applicationId: parsed.applicationId,
      statusAtual: "Aprovado",
      motivoStaff: null,
      reviewedById: interaction.user.id,
      reviewedByTag: interaction.user.tag,
    });

    await interaction.update({
      embeds: [buildApplicationEmbed(updatedApplication)],
      components: [buildStaffDecisionRow(updatedApplication)],
    });

    await notifyCandidate(interaction, parsed.userId, "Aprovado");
    return true;
  }

  if (parsed.action === "reopen") {
    const config = getTriagemConfig(interaction.guildId);

    try {
      const member = await interaction.guild.members.fetch(parsed.userId);

      if (config.recrutaRoleId) {
        try {
          await member.roles.remove(config.recrutaRoleId);
        } catch {}
      }

      if (config.conscritoRoleId) {
        try {
          await member.roles.add(config.conscritoRoleId);
        } catch {}
      }
    } catch (error) {
      console.error("Não foi possível reajustar os cargos ao reabrir:", error);
    }

    const updatedApplication = await updateApplicationDecision({
      applicationId: parsed.applicationId,
      statusAtual: "Pendente",
      motivoStaff: `Candidatura reaberta por ${interaction.user.tag}.`,
      reviewedById: interaction.user.id,
      reviewedByTag: interaction.user.tag,
    });

    await interaction.update({
      embeds: [buildApplicationEmbed(updatedApplication)],
      components: [buildStaffDecisionRow(updatedApplication)],
    });

    await notifyCandidate(interaction, parsed.userId, "Pendente");
    return true;
  }

  return true;
}