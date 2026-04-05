import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type ApplicationStatus =
  | "Pendente"
  | "Em entrevista"
  | "Revisão solicitada"
  | "Aprovado"
  | "Reprovado";

export type ApplicationTimelineEvent = {
  type:
    | "application_created"
    | "staff_message_attached"
    | "status_changed";
  status: ApplicationStatus;
  actorId: string | null;
  actorTag: string | null;
  reason: string | null;
  createdAt: string;
};

export type RecruitmentApplication = {
  id: string;
  guildId: string;
  userId: string;
  userTag: string;
  nickJogo: string;
  idade: string;
  experiencia: string;
  disponibilidade: string;
  statusAtual: ApplicationStatus;
  motivoStaff: string | null;
  reviewedById: string | null;
  reviewedByTag: string | null;
  staffChannelId: string | null;
  staffMessageId: string | null;
  createdAt: string;
  updatedAt: string;
  timeline: ApplicationTimelineEvent[];
};

type ApplicationsStoreShape = Record<string, RecruitmentApplication>;

const applicationsStore = new Map<string, RecruitmentApplication>();

const DATA_DIR = path.resolve(process.cwd(), "data");
const APPLICATIONS_FILE_PATH = path.resolve(DATA_DIR, "applications.json");

export async function loadApplicationsStore() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    const file = await readFile(APPLICATIONS_FILE_PATH, "utf-8");
    const parsed = JSON.parse(file) as ApplicationsStoreShape;

    applicationsStore.clear();

    for (const [applicationId, application] of Object.entries(parsed)) {
      applicationsStore.set(applicationId, application);
    }
  } catch (error) {
    const shouldCreateEmptyFile =
      error instanceof Error && "code" in error && error.code === "ENOENT";

    if (shouldCreateEmptyFile) {
      await saveApplicationsStore();
      return;
    }

    throw error;
  }
}

export async function saveApplicationsStore() {
  await mkdir(DATA_DIR, { recursive: true });

  const serializable: ApplicationsStoreShape = {};

  for (const [applicationId, application] of applicationsStore.entries()) {
    serializable[applicationId] = application;
  }

  await writeFile(
    APPLICATIONS_FILE_PATH,
    JSON.stringify(serializable, null, 2),
    "utf-8",
  );
}

export function getApplicationById(applicationId: string) {
  return applicationsStore.get(applicationId) ?? null;
}

export function listApplicationsByGuild(guildId: string) {
  return [...applicationsStore.values()].filter(
    (application) => application.guildId === guildId,
  );
}

export async function createApplication(input: {
  guildId: string;
  userId: string;
  userTag: string;
  nickJogo: string;
  idade: string;
  experiencia: string;
  disponibilidade: string;
}) {
  const now = new Date().toISOString();

  const application: RecruitmentApplication = {
    id: randomUUID(),
    guildId: input.guildId,
    userId: input.userId,
    userTag: input.userTag,
    nickJogo: input.nickJogo,
    idade: input.idade,
    experiencia: input.experiencia,
    disponibilidade: input.disponibilidade,
    statusAtual: "Pendente",
    motivoStaff: null,
    reviewedById: null,
    reviewedByTag: null,
    staffChannelId: null,
    staffMessageId: null,
    createdAt: now,
    updatedAt: now,
    timeline: [
      {
        type: "application_created",
        status: "Pendente",
        actorId: input.userId,
        actorTag: input.userTag,
        reason: null,
        createdAt: now,
      },
    ],
  };

  applicationsStore.set(application.id, application);
  await saveApplicationsStore();

  return application;
}

export async function attachStaffMessageToApplication(input: {
  applicationId: string;
  staffChannelId: string;
  staffMessageId: string;
}) {
  const application = applicationsStore.get(input.applicationId);

  if (!application) {
    throw new Error("Candidatura não encontrada");
  }

  const now = new Date().toISOString();

  application.staffChannelId = input.staffChannelId;
  application.staffMessageId = input.staffMessageId;
  application.updatedAt = now;
  application.timeline.push({
    type: "staff_message_attached",
    status: application.statusAtual,
    actorId: null,
    actorTag: null,
    reason: null,
    createdAt: now,
  });

  applicationsStore.set(application.id, application);
  await saveApplicationsStore();

  return application;
}

export async function updateApplicationDecision(input: {
  applicationId: string;
  statusAtual: ApplicationStatus;
  motivoStaff?: string | null;
  reviewedById: string;
  reviewedByTag: string;
}) {
  const application = applicationsStore.get(input.applicationId);

  if (!application) {
    throw new Error("Candidatura não encontrada");
  }

  const now = new Date().toISOString();

  application.statusAtual = input.statusAtual;
  application.motivoStaff =
    input.motivoStaff === undefined ? application.motivoStaff : input.motivoStaff;
  application.reviewedById = input.reviewedById;
  application.reviewedByTag = input.reviewedByTag;
  application.updatedAt = now;
  application.timeline.push({
    type: "status_changed",
    status: input.statusAtual,
    actorId: input.reviewedById,
    actorTag: input.reviewedByTag,
    reason: input.motivoStaff ?? null,
    createdAt: now,
  });

  applicationsStore.set(application.id, application);
  await saveApplicationsStore();

  return application;
}