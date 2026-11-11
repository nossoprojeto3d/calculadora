// Idiomas: todo texto passado para t("...") no código precisa ter tradução
// em pt-PT, espanhol e inglês, com os mesmos {marcadores} do original.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { TRADUCOES } from "../../src/i18n";
import { t, usarIdioma } from "../../src/lib/i18n";
import { DEFAULT_JOB_NAME, MATERIALS, PRINTERS, PRO_COSTS, SHOPEE_TIER_OPTION_LABELS } from "../../src/lib/data";

const SRC = new URL("../../src/", import.meta.url).pathname;

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n === "i18n" ? [] : arquivos(p);
    return /\.(ts|tsx)$/.test(n) ? [p] : [];
  });
}

/** Todos os t("...") com texto literal (aspas duplas) do código. */
function chamadas() {
  const achadas: { texto: string; arquivo: string }[] = [];
  for (const arquivo of arquivos(SRC)) {
    const codigo = readFileSync(arquivo, "utf8");
    for (const m of codigo.matchAll(/(?<![\w.])t\(\s*("(?:[^"\\\n]|\\.)*")/g)) {
      achadas.push({ texto: JSON.parse(m[1]), arquivo: arquivo.replace(SRC, "src/") });
    }
  }
  return achadas;
}

const marcadores = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

describe("idiomas", () => {
  afterEach(() => usarIdioma("pt-BR"));

  it("todo t(\"...\") do código tem tradução", () => {
    const faltando = chamadas().filter((c) => !TRADUCOES[c.texto]).map((c) => `${c.arquivo}: ${c.texto}`);
    expect([...new Set(faltando)]).toEqual([]);
  });

  it("os textos dos dados (custos, materiais) têm tradução quando aparecem na tela", () => {
    const textos = [
      ...PRO_COSTS.flatMap((c: any) => [c.label, c.hint, c.fieldLabel, c.errorText, c.warningText]),
      ...PRINTERS.map((p) => p.desc),
      ...MATERIALS.filter((m) => m.group !== "PLA").map((m) => m.group),
      ...MATERIALS.filter((m) => m.name.includes("(")).map((m) => m.name),
      DEFAULT_JOB_NAME,
      ...SHOPEE_TIER_OPTION_LABELS,
    ].filter((s): s is string => typeof s === "string" && s.trim() !== "");
    expect([...new Set(textos.filter((s) => !TRADUCOES[s]))]).toEqual([]);
  });

  it("traduções completas, sem texto vazio e com os mesmos marcadores", () => {
    const problemas: string[] = [];
    for (const [pt, linha] of Object.entries(TRADUCOES)) {
      if (linha.length !== 3 || linha.some((s) => !s.trim())) problemas.push(`incompleta: ${pt}`);
      for (const s of linha) if (marcadores(s) !== marcadores(pt)) problemas.push(`marcadores: ${pt} → ${s}`);
    }
    expect(problemas).toEqual([]);
  });

  it("pt-BR é o padrão e idioma desconhecido volta para ele", () => {
    usarIdioma("xx");
    expect(t("Idioma")).toBe("Idioma");
    usarIdioma("en");
    expect(t("Idioma")).toBe("Language");
    usarIdioma("es");
    expect(t("Calculadora de impressão 3D")).toBe("Calculadora de impresión 3D");
  });
});
