import type { Client } from "discord.js";
import { publishOrUpdateDashboard } from "../dashboard/dashboard.publisher";
import { loadApplicationsStore } from "../dashboard/applications.store";
import { loadTriagemStore } from "../dashboard/triagem.state";

export async function handleReady(client: Client) {
  console.log(`Bot online como ${client.user?.tag}`);

  try {
    await loadTriagemStore();
    console.log("Triagem carregada do JSON com sucesso.");

    await loadApplicationsStore();
    console.log("Candidaturas carregadas do JSON com sucesso.");

    await publishOrUpdateDashboard(client, "home");
    console.log("Dashboard publicada/atualizada com sucesso.");
  } catch (error) {
    console.error("Erro ao inicializar o bot:", error);
  }
}