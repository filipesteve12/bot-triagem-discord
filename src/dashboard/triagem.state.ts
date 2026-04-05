import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type TriagemConfig = {
  triagemChannelId: string | null;
  staffChannelId: string | null;
  conscritoRoleId: string | null;
  recrutaRoleId: string | null;
  publishedRecruitmentChannelId: string | null;
  publishedRecruitmentMessageId: string | null;
};

type TriagemStoreShape = Record<string, TriagemConfig>;

const triagemStore = new Map<string, TriagemConfig>();

const DATA_DIR = path.resolve(process.cwd(), "data");
const TRIAGEM_FILE_PATH = path.resolve(DATA_DIR, "triagem-config.json");

function createDefaultTriagemConfig(): TriagemConfig {
  return {
    triagemChannelId: null,
    staffChannelId: null,
    conscritoRoleId: null,
    recrutaRoleId: null,
    publishedRecruitmentChannelId: null,
    publishedRecruitmentMessageId: null,
  };
}

export async function loadTriagemStore() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    const file = await readFile(TRIAGEM_FILE_PATH, "utf-8");
    const parsed = JSON.parse(file) as TriagemStoreShape;

    triagemStore.clear();

    for (const [guildId, config] of Object.entries(parsed)) {
      triagemStore.set(guildId, {
        triagemChannelId: config.triagemChannelId ?? null,
        staffChannelId: config.staffChannelId ?? null,
        conscritoRoleId: config.conscritoRoleId ?? null,
        recrutaRoleId: config.recrutaRoleId ?? null,
        publishedRecruitmentChannelId:
          config.publishedRecruitmentChannelId ?? null,
        publishedRecruitmentMessageId:
          config.publishedRecruitmentMessageId ?? null,
      });
    }
  } catch (error) {
    const shouldCreateEmptyFile =
      error instanceof Error && "code" in error && error.code === "ENOENT";

    if (shouldCreateEmptyFile) {
      await saveTriagemStore();
      return;
    }

    throw error;
  }
}

export function getTriagemConfig(guildId: string): TriagemConfig {
  if (!triagemStore.has(guildId)) {
    triagemStore.set(guildId, createDefaultTriagemConfig());
  }

  return triagemStore.get(guildId)!;
}

export async function updateTriagemConfig(
  guildId: string,
  patch: Partial<TriagemConfig>,
): Promise<TriagemConfig> {
  const current = getTriagemConfig(guildId);

  const updated: TriagemConfig = {
    ...current,
    ...patch,
  };

  triagemStore.set(guildId, updated);
  await saveTriagemStore();

  return updated;
}

export async function saveTriagemStore() {
  await mkdir(DATA_DIR, { recursive: true });

  const serializable: TriagemStoreShape = {};

  for (const [guildId, config] of triagemStore.entries()) {
    serializable[guildId] = config;
  }

  await writeFile(
    TRIAGEM_FILE_PATH,
    JSON.stringify(serializable, null, 2),
    "utf-8",
  );
}