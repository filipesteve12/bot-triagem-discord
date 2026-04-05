import { stringify } from "csv-stringify/sync";
import {
  listApplicationsByGuild,
  type ApplicationStatus,
} from "./applications.store";

export function buildApplicationsCsv(
  guildId: string,
  status?: ApplicationStatus,
) {
  const applications = listApplicationsByGuild(guildId).filter((application) =>
    status ? application.statusAtual === status : true,
  );

  const rows = applications.map((application) => ({
    application_id: application.id,
    guild_id: application.guildId,
    user_id: application.userId,
    user_tag: application.userTag,
    nick_jogo: application.nickJogo,
    idade: application.idade,
    experiencia: application.experiencia,
    disponibilidade: application.disponibilidade,
    status_atual: application.statusAtual,
    motivo_staff: application.motivoStaff ?? "",
    reviewed_by_id: application.reviewedById ?? "",
    reviewed_by_tag: application.reviewedByTag ?? "",
    staff_channel_id: application.staffChannelId ?? "",
    staff_message_id: application.staffMessageId ?? "",
    created_at: application.createdAt,
    updated_at: application.updatedAt,
    timeline_total: application.timeline.length,
  }));

  const csv = stringify(rows, {
    header: true,
    columns: [
      { key: "application_id", header: "application_id" },
      { key: "guild_id", header: "guild_id" },
      { key: "user_id", header: "user_id" },
      { key: "user_tag", header: "user_tag" },
      { key: "nick_jogo", header: "nick_jogo" },
      { key: "idade", header: "idade" },
      { key: "experiencia", header: "experiencia" },
      { key: "disponibilidade", header: "disponibilidade" },
      { key: "status_atual", header: "status_atual" },
      { key: "motivo_staff", header: "motivo_staff" },
      { key: "reviewed_by_id", header: "reviewed_by_id" },
      { key: "reviewed_by_tag", header: "reviewed_by_tag" },
      { key: "staff_channel_id", header: "staff_channel_id" },
      { key: "staff_message_id", header: "staff_message_id" },
      { key: "created_at", header: "created_at" },
      { key: "updated_at", header: "updated_at" },
      { key: "timeline_total", header: "timeline_total" },
    ],
  });

  return Buffer.from(csv, "utf-8");
}