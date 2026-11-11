/* =========================================================
   IDIOMAS
   O texto em português do Brasil é a própria chave: t("Calcular") devolve
   "Calcular" em pt-BR e a tradução nos outros idiomas. As traduções ficam em
   src/i18n/*.ts, uma linha por texto: [pt-PT, es, en].
   O idioma só troca os textos (e o formato das datas). Moeda e números
   continuam como estão: real por padrão, formato brasileiro.
   ========================================================= */

import { TRADUCOES } from "../i18n";

export type Idioma = "pt-BR" | "pt-PT" | "es" | "en";

export const IDIOMAS: { id: Idioma; nome: string; curto: string; locale: string }[] = [
  { id: "pt-BR", nome: "Português (Brasil)", curto: "BR", locale: "pt-BR" },
  { id: "pt-PT", nome: "Português (Portugal)", curto: "PT", locale: "pt-PT" },
  { id: "es", nome: "Español", curto: "ES", locale: "es-ES" },
  { id: "en", nome: "English", curto: "EN", locale: "en-US" },
];

/** Posição de cada idioma na linha [pt-PT, es, en] das traduções. */
const COLUNA: Record<Exclude<Idioma, "pt-BR">, number> = { "pt-PT": 0, es: 1, en: 2 };

let idiomaAtual: Idioma = "pt-BR";

export function usarIdioma(i: unknown) {
  idiomaAtual = IDIOMAS.some((x) => x.id === i) ? (i as Idioma) : "pt-BR";
}
export const idiomaAtivo = () => idiomaAtual;
/** Locale para datas (números e dinheiro continuam no formato brasileiro). */
export const localeDatas = () => (IDIOMAS.find((x) => x.id === idiomaAtual) ?? IDIOMAS[0]).locale;

/** Traduz um texto (escrito em pt-BR) e troca os {marcadores} pelos valores. */
export function t(texto: string, vars?: Record<string, string | number>): string {
  let saida = texto;
  if (idiomaAtual !== "pt-BR") saida = TRADUCOES[texto]?.[COLUNA[idiomaAtual]] ?? texto;
  if (vars) saida = saida.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
  return saida;
}
