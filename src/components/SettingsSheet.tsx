/* Configurações em lista (estilo "Ajustes" do iPhone): a loja em cima, depois
   "Preços padrão" e "Aplicativo". Cada linha mostra o valor atual e abre uma
   subtela para editar. Salva sozinho: escolhas (lista, interruptor) na hora;
   campos digitados ao voltar ou fechar (salvar a cada tecla preencheria o
   formulário com o valor pela metade, porque os padrões entram nos campos vazios). */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, m, useReducedMotion, type Variants } from "motion/react";
import {
  CalendarBlank, CaretLeft, CaretRight, Check, CircleHalf, CurrencyCircleDollar, DownloadSimple, Globe, ImageSquare,
  Lightning, Printer, Storefront, Timer, Trash, TrendUp, Warning,
} from "@phosphor-icons/react";
import { IDIOMAS, t, type Idioma } from "../lib/i18n";
import { readLogoFile } from "../lib/storage";
import { PRINTERS } from "../lib/data";
import { MOEDAS, defaultStoreSettings, sanitizeDecimal, simboloMoeda, type StoreSettings } from "../lib/calc";
import type { Calculator } from "../lib/useCalculator";
import { InputField, Sheet, Switch } from "./ui";
import type { Theme } from "../App";

export type TelaConfig = "inicio" | "loja" | "impressora" | "kwh" | "lucro" | "valorHora" | "falha" | "validade" | "idioma" | "moeda" | "tema";

// troca de tela "empurrando", como no iPhone: a subtela entra pela direita e,
// ao voltar, a lista entra pela esquerda (d = 1 indo, -1 voltando)
const DESLIZE = 48;
const transicao: Variants = {
  entra: (d: number) => ({ x: d * DESLIZE, opacity: 0 }),
  parado: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 320, damping: 34, opacity: { duration: 0.22 } } },
  sai: (d: number) => ({ x: -d * DESLIZE, opacity: 0, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } }),
};
const transicaoSuave: Variants = {
  entra: { opacity: 0 }, parado: { opacity: 1, transition: { duration: 0.2 } }, sai: { opacity: 0, transition: { duration: 0.12 } },
};

const limpar = (s: StoreSettings) =>
  Object.fromEntries(Object.entries(s).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])) as unknown as StoreSettings;

export function SettingsSheet({ calc, open, onOpenChange, inicio = "inicio", theme, onTheme, idioma, onIdioma, desktop, canInstall, onInstall }: {
  calc: Calculator; open: boolean; onOpenChange: (o: boolean) => void;
  /** tela que abre primeiro (ex.: "loja" pelo lembrete do orçamento) */
  inicio?: TelaConfig;
  theme: Theme; onTheme: (tema: Theme) => void;
  /** idioma e moeda ficam aqui só no celular; no computador estão no cabeçalho */
  idioma: Idioma; onIdioma: (i: Idioma) => void; desktop: boolean;
  canInstall: boolean; onInstall: () => void;
}) {
  const [draft, setDraft] = useState<StoreSettings>(calc.settings);
  const [tela, setTela] = useState<TelaConfig>(inicio);
  const fileRef = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const mudou = useRef(false);
  const reduce = useReducedMotion();
  const corpo = useRef<HTMLDivElement>(null);
  const direcao = tela === "inicio" ? -1 : 1;
  // o título acompanha a tela que está à vista (troca quando a anterior termina de sair)
  const [titulo, setTitulo] = useState<TelaConfig>(inicio);

  useEffect(() => {
    if (!open) return;
    setDraft(calc.settings);
    setTela(inicio);
    setTitulo(inicio);
    setLogoError(null);
    mudou.current = false;
    // só ao abrir: depois disso, o rascunho é a fonte enquanto a gaveta está aberta
  }, [open]);

  /** Grava o rascunho (sem espaços nas pontas) se algo mudou. */
  const gravar = (next: StoreSettings = draft) => {
    const limpo = limpar(next);
    if (JSON.stringify(limpo) === JSON.stringify(calc.settings)) return;
    calc.updateSettings(limpo);
    mudou.current = true;
  };
  /** Escolha que vale na hora (lista ou interruptor). */
  const escolher = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    gravar(next);
  };
  const set = (key: keyof StoreSettings, value: string) => setDraft((d) => ({ ...d, [key]: value }));
  const dec = (key: keyof StoreSettings) => (v: string) => set(key, sanitizeDecimal(v));

  const voltar = () => { gravar(); setTela("inicio"); };
  const fechar = (o: boolean) => {
    if (!o) {
      gravar();
      if (mudou.current) calc.showToast(t("Configurações salvas."));
    }
    onOpenChange(o);
  };
  const restaurar = () => {
    calc.updateSettings(null);
    setDraft(defaultStoreSettings());
    calc.showToast(t("Configurações salvas."));
    onOpenChange(false);
  };

  // o logo é salvo na hora, como uma foto de perfil
  const onLogo = async (file: File | undefined) => {
    setLogoError(null);
    if (!file) return;
    try {
      const dataUrl = await readLogoFile(file);
      if (!calc.updateStoreLogo(dataUrl)) setLogoError(t("Não coube no armazenamento do aparelho. Tente uma imagem menor."));
    } catch {
      setLogoError(t("Não foi possível ler essa imagem. Use PNG ou JPG."));
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const simbolo = simboloMoeda(draft.currency);
  const impressora = PRINTERS.find((p) => p.id === draft.defaultPrinter);
  const ou = (v: string, texto: string) => (v.trim() ? texto : "—");
  const temas = [["system", t("Sistema")], ["light", t("Claro")], ["dark", t("Escuro")]] as const;
  const idiomaAtual = IDIOMAS.find((i) => i.id === idioma) ?? IDIOMAS[0];
  const moedaAtual = MOEDAS.find((m) => m.id === draft.currency) ?? MOEDAS[0];
  const instagram = draft.instagram.trim() ? `@${draft.instagram.trim().replace(/^@/, "")}` : "";

  const titulos: Record<TelaConfig, string> = {
    inicio: t("Configurações"), loja: t("Sua loja no orçamento"), impressora: t("Impressora padrão"),
    kwh: t("Valor do kWh"), lucro: t("Margem de lucro"), valorHora: t("Seu valor-hora"), falha: t("Margem de falha"),
    validade: t("Validade do orçamento"), idioma: t("Idioma"), moeda: t("Moeda"), tema: t("Tema"),
  };

  // ===================== TELA PRINCIPAL =====================
  const principal = (
    <div className="flex flex-col gap-6">
      <button type="button" onClick={() => setTela("loja")} aria-label={t("Sua loja no orçamento")}
        className="flex items-center gap-3 rounded-2xl bg-surface p-3.5 text-left transition-colors hover:bg-surface-2"
        style={{ boxShadow: "inset 0 0 0 1px var(--line)" }}>
        <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent-soft text-accent-text">
          {calc.storeLogo
            ? <img src={calc.storeLogo} alt="" className="max-h-full max-w-full object-contain p-1" />
            : <Storefront size={24} aria-hidden="true" />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[16px] font-semibold">{draft.storeName.trim() || t("Sua loja")}</span>
          <span className="truncate text-[13.5px] text-ink-3">
            {[draft.city.trim(), instagram].filter(Boolean).join(" · ") || t("Nome, logo e contatos no orçamento")}
          </span>
        </span>
        <CaretRight size={16} className="shrink-0 text-ink-3" aria-hidden="true" />
      </button>

      <Grupo titulo={t("Preços padrão")}>
        <Linha icon={<Printer />} label={t("Impressora")} valor={impressora?.name ?? t("Nenhuma preferência")} onClick={() => setTela("impressora")} />
        <Linha icon={<Lightning />} label={t("Valor do kWh")} valor={ou(draft.kwhPrice, `${simbolo} ${draft.kwhPrice}`)} onClick={() => setTela("kwh")} />
        <Linha icon={<TrendUp />} label={t("Margem de lucro")} valor={ou(draft.marginPct, `${draft.marginPct}%`)} onClick={() => setTela("lucro")} />
        <Linha icon={<Timer />} label={t("Seu valor-hora")} valor={ou(draft.hourlyRate, `${simbolo} ${draft.hourlyRate}`)} onClick={() => setTela("valorHora")} />
        <Linha icon={<Warning />} label={t("Margem de falha")} valor={ou(draft.failurePct, `${draft.failurePct}%`)} onClick={() => setTela("falha")} />
        <Linha icon={<CalendarBlank />} label={t("Validade do orçamento")}
          valor={draft.validityDays.trim() ? `${draft.validityDays} ${t("dias")}` : t("Sem validade")} onClick={() => setTela("validade")} />
        <label className="flex min-h-[54px] cursor-pointer items-center gap-3 px-3.5">
          <Icone><span className="num text-[12px] font-bold">,99</span></Icone>
          <span className="flex-1 text-[15.5px]">{t("Arredondar para ,99")}</span>
          <Switch checked={draft.roundDefault !== false} onChange={(v) => escolher("roundDefault", v)} label={t("Arredondar para ,99")} />
        </label>
      </Grupo>

      <Grupo titulo={t("Aplicativo")}>
        {!desktop && <Linha icon={<Globe />} label={t("Idioma")} valor={idiomaAtual.nome} onClick={() => setTela("idioma")} />}
        {!desktop && <Linha icon={<CurrencyCircleDollar />} label={t("Moeda")} valor={`${t(moedaAtual.nome)} (${moedaAtual.simbolo})`} onClick={() => setTela("moeda")} />}
        <Linha icon={<CircleHalf />} label={t("Tema")} valor={temas.find(([id]) => id === theme)?.[1] ?? ""} onClick={() => setTela("tema")} />
        {canInstall && <Linha icon={<DownloadSimple />} label={t("Instalar como app")} onClick={onInstall} />}
      </Grupo>

      <button type="button" onClick={restaurar} className="mx-auto min-h-[44px] px-4 text-[14px] font-medium text-ink-3 underline-offset-4 hover:text-ink hover:underline">
        {t("Restaurar padrão")}
      </button>
    </div>
  );

  // ===================== SUBTELAS =====================
  const campo = (id: string, node: ReactNode) => <div key={id} className="flex flex-col gap-2">{node}</div>;
  const subtelas: Partial<Record<TelaConfig, ReactNode>> = {
    loja: (
      <div className="flex flex-col gap-4">
        <p className="hint">{t("Aparece no orçamento do WhatsApp e do PDF. O logo vai no PDF do cliente.")}</p>
        <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3" style={{ boxShadow: "inset 0 0 0 1px var(--line)" }}>
          <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface" style={{ boxShadow: "inset 0 0 0 1px var(--line)" }}>
            {calc.storeLogo
              ? <img src={calc.storeLogo} alt={t("Logo da sua loja")} className="max-h-full max-w-full object-contain p-1.5" />
              : <ImageSquare size={24} className="text-ink-3" aria-hidden="true" />}
          </span>
          <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
            <span className="text-[15px] font-medium">{t("Logo da loja")}</span>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-secondary min-h-[40px] px-4 text-[14px]" onClick={() => fileRef.current?.click()}>
                {calc.storeLogo ? t("Trocar") : t("Enviar imagem")}
              </button>
              {calc.storeLogo && (
                <button type="button" className="icon-btn hover:text-danger" aria-label={t("Remover logo")} onClick={() => calc.updateStoreLogo(null)}>
                  <Trash size={18} />
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label={t("Escolher logo da loja")}
              onChange={(e) => onLogo(e.target.files?.[0])} />
          </div>
        </div>
        {logoError && <p className="error-text" role="alert">{logoError}</p>}
        <InputField id="settingsStoreName" kind="text" label={t("Nome da loja")} placeholder={t("Ex: Ateliê Camadas")} value={draft.storeName} onChange={(v) => set("storeName", v)} />
        <InputField id="settingsCity" kind="text" label={t("Cidade")} placeholder={t("Ex: Goiânia/GO")} value={draft.city} onChange={(v) => set("city", v)} />
        <InputField id="settingsWhatsapp" kind="tel" label="WhatsApp" placeholder="(62) 99999-0000" value={draft.whatsapp} onChange={(v) => set("whatsapp", v)} />
        <InputField id="settingsInstagram" kind="text" label="Instagram" placeholder="@sualoja3d" value={draft.instagram} onChange={(v) => set("instagram", v)} />
      </div>
    ),
    impressora: (
      <Opcoes valor={draft.defaultPrinter} onEscolher={(v) => { escolher("defaultPrinter", v); setTela("inicio"); }}
        grupos={[
          { opcoes: [{ id: "", nome: t("Nenhuma preferência") }] },
          ...[...new Set(PRINTERS.map((p) => p.brand))].map((brand) => ({
            titulo: brand, opcoes: PRINTERS.filter((p) => p.brand === brand).map((p) => ({ id: p.id, nome: p.name, detalhe: t(p.desc) })),
          })),
        ]} />
    ),
    kwh: campo("kwh", <InputField id="settingsKwh" ariaLabel={t("Valor do kWh")} prefix={simbolo} placeholder="0,85" value={draft.kwhPrice} onChange={dec("kwhPrice")} />),
    lucro: campo("lucro", <InputField id="settingsMarginPct" ariaLabel={t("Margem de lucro")} suffix="%" placeholder="100" value={draft.marginPct} onChange={dec("marginPct")} />),
    valorHora: campo("valorHora", <InputField id="settingsHourlyRate" ariaLabel={t("Seu valor-hora")} prefix={simbolo} placeholder="25,00" value={draft.hourlyRate} onChange={dec("hourlyRate")}
      hint={t("Calcula a mão de obra.")} />),
    falha: campo("falha", <InputField id="settingsFailurePct" ariaLabel={t("Margem de falha")} suffix="%" placeholder="10" value={draft.failurePct} onChange={dec("failurePct")}
      hint={t("Quando ligada no Profissional.")} />),
    validade: campo("validade", <InputField id="settingsValidityDays" kind="numeric" ariaLabel={t("Validade do orçamento")} suffix={t("dias")} placeholder="7"
      value={draft.validityDays} onChange={(x) => set("validityDays", x.replace(/[^\d]/g, "").slice(0, 3))}
      hint={t("Vai no orçamento do cliente. Vazio = sem validade.")} />),
    idioma: (
      <Opcoes valor={idioma} onEscolher={(v) => { onIdioma(v as Idioma); setTela("inicio"); }}
        grupos={[{ opcoes: IDIOMAS.map((i) => ({ id: i.id, nome: i.nome, lang: i.id })) }]} />
    ),
    moeda: (
      <div className="flex flex-col gap-3">
        <Opcoes valor={draft.currency} onEscolher={(v) => { escolher("currency", v as StoreSettings["currency"]); setTela("inicio"); }}
          grupos={[{ opcoes: MOEDAS.map((m) => ({ id: m.id, nome: t(m.nome), marca: m.simbolo })) }]} />
        <p className="hint px-1">{t("Muda o símbolo nos valores, no WhatsApp e no PDF. Não converte: digite os preços na moeda escolhida.")}</p>
      </div>
    ),
    tema: (
      <Opcoes valor={theme} onEscolher={(v) => { onTheme(v as Theme); setTela("inicio"); }}
        grupos={[{ opcoes: temas.map(([id, nome]) => ({ id, nome })) }]} />
    ),
  };

  return (
    <Sheet open={open} onOpenChange={fechar} title={titulos[titulo]}>
      <div ref={corpo} className="overflow-x-clip">
      {/* a tela nova começa do topo da rolagem */}
      <AnimatePresence mode="wait" initial={false} custom={direcao}
        onExitComplete={() => { setTitulo(tela); corpo.current?.closest(".overflow-y-auto")?.scrollTo({ top: 0 }); }}>
      <m.div key={tela} custom={direcao} variants={reduce ? transicaoSuave : transicao} initial="entra" animate="parado" exit="sai">
      {tela === "inicio" ? principal : (
        <div className="flex min-h-[55dvh] flex-col gap-4 lg:min-h-0">
          <button type="button" onClick={voltar}
            className="-ml-2 inline-flex min-h-[40px] items-center gap-1 self-start rounded-full pl-1 pr-3 text-[14.5px] font-medium text-accent-text hover:bg-surface-2">
            <CaretLeft size={18} aria-hidden="true" />{t("Configurações")}
          </button>
          {subtelas[tela]}
        </div>
      )}
      </m.div>
      </AnimatePresence>
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------
// PEÇAS DA LISTA
// ---------------------------------------------------------
function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="px-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3">{titulo}</h3>
      <div className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl bg-surface" style={{ boxShadow: "inset 0 0 0 1px var(--line)" }}>
        {children}
      </div>
    </section>
  );
}

function Icone({ children }: { children: ReactNode }) {
  return (
    <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[9px] bg-accent-soft text-accent-text [&>svg]:size-[17px]" aria-hidden="true">
      {children}
    </span>
  );
}

function Linha({ icon, label, valor, onClick }: { icon: ReactNode; label: string; valor?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-[54px] items-center gap-3 px-3.5 text-left transition-colors hover:bg-surface-2">
      <Icone>{icon}</Icone>
      <span className="min-w-0 flex-1 truncate text-[15.5px]">{label}</span>
      {valor && <span className="num max-w-[45%] truncate text-[14.5px] text-ink-3">{valor}</span>}
      <CaretRight size={15} className="shrink-0 text-ink-3" aria-hidden="true" />
    </button>
  );
}

type Opcao = { id: string; nome: string; detalhe?: string; marca?: string; lang?: string };

function Opcoes({ valor, onEscolher, grupos }: { valor: string; onEscolher: (id: string) => void; grupos: { titulo?: string; opcoes: Opcao[] }[] }) {
  return (
    <div className="flex flex-col gap-5">
      {grupos.map((g, gi) => (
        <section key={g.titulo ?? gi} className="flex flex-col gap-2">
          {g.titulo && <h3 className="px-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3">{g.titulo}</h3>}
          <div role="radiogroup" aria-label={g.titulo} className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl bg-surface" style={{ boxShadow: "inset 0 0 0 1px var(--line)" }}>
            {g.opcoes.map((o) => (
              <button key={o.id} type="button" role="radio" aria-checked={valor === o.id} lang={o.lang} onClick={() => onEscolher(o.id)}
                className="flex min-h-[52px] items-center gap-3 px-3.5 py-2 text-left transition-colors hover:bg-surface-2">
                {o.marca && <span className="num w-[34px] text-[13px] font-semibold text-ink-3">{o.marca}</span>}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[15.5px]">{o.nome}</span>
                  {o.detalhe && <span className="truncate text-[13px] text-ink-3">{o.detalhe}</span>}
                </span>
                {valor === o.id && <Check size={18} weight="bold" className="shrink-0 text-accent-text" aria-hidden="true" />}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
