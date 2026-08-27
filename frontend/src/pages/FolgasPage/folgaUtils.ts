// Uma folga é sempre gravada com type "folga", mas tem dois significados de negócio
// distintos: compensa um domingo trabalhado específico ("Folga Remunerada") ou é um
// abatimento genérico do banco de horas sem domingo vinculado ("Folga Banco de Horas",
// lançada pelo LaunchModal com o texto fixo abaixo). A distinção nunca foi um campo
// próprio no banco — só dá pra saber lendo o texto do refDate.
export const isBancoHorasFolga = (refDate?: string | null): boolean =>
  !!refDate && refDate.toLowerCase().includes("banco de horas");

export const folgaSubtypeLabel = (refDate?: string | null): string =>
  isBancoHorasFolga(refDate) ? "Folga (Banco de Horas)" : "Folga Remunerada";

// Cores usadas nos badges/tabelas para cada subtipo de folga (RGB, para uso tanto em
// classes Tailwind quanto em jsPDF).
export const FOLGA_SUBTYPE_COLORS = {
  remunerada: { rgb: [245, 158, 11] as [number, number, number] }, // amber
  bancoHoras: { rgb: [13, 148, 136] as [number, number, number] }, // teal
};
