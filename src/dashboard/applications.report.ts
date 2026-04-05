import { listApplicationsByGuild } from "./applications.store";

export function buildApplicationsReport(guildId: string) {
  const applications = listApplicationsByGuild(guildId);

  const report = {
    total: applications.length,
    pendente: 0,
    emEntrevista: 0,
    revisaoSolicitada: 0,
    aprovado: 0,
    reprovado: 0,
  };

  for (const application of applications) {
    switch (application.statusAtual) {
      case "Pendente":
        report.pendente += 1;
        break;
      case "Em entrevista":
        report.emEntrevista += 1;
        break;
      case "Revisão solicitada":
        report.revisaoSolicitada += 1;
        break;
      case "Aprovado":
        report.aprovado += 1;
        break;
      case "Reprovado":
        report.reprovado += 1;
        break;
    }
  }

  return report;
}