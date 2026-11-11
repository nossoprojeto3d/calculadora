/* Seletores do cabeçalho no computador: idioma (globo + sigla) e moeda (símbolo).
   No celular os dois ficam dentro das Configurações. */
import * as Menu from "@radix-ui/react-dropdown-menu";
import { CaretDown, Check, Globe } from "@phosphor-icons/react";
import { IDIOMAS, t, type Idioma } from "../lib/i18n";
import { MOEDAS, type Moeda } from "../lib/calc";

const MENU_CLASSE = "rounded-2xl bg-surface p-1.5 text-ink shadow-xl";
const MENU_ESTILO = { zIndex: "var(--z-toast)", boxShadow: "inset 0 0 0 1px var(--line), 0 16px 40px -12px rgb(var(--shadow-tint) / 0.45)" };
const ITEM_CLASSE = "flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl px-3 text-[15px] outline-none data-[highlighted]:bg-surface-2";

function Marcado() {
  return <Menu.ItemIndicator><Check size={16} weight="bold" className="text-accent-text" aria-hidden="true" /></Menu.ItemIndicator>;
}

export function SeletorIdioma({ idioma, onIdioma }: { idioma: Idioma; onIdioma: (i: Idioma) => void }) {
  const atual = IDIOMAS.find((i) => i.id === idioma) ?? IDIOMAS[0];
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger asChild>
        <button type="button" className="icon-btn w-auto gap-1 px-2.5" aria-label={`${t("Idioma")}: ${atual.nome}`} title={t("Idioma")}>
          <Globe size={20} aria-hidden="true" />
          <span className="num text-[12.5px] font-semibold tracking-[0.02em]">{atual.curto}</span>
        </button>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align="end" sideOffset={6} collisionPadding={12} className={`${MENU_CLASSE} min-w-[220px]`} style={MENU_ESTILO}>
          <Menu.RadioGroup value={idioma} onValueChange={(v) => onIdioma(v as Idioma)}>
            {IDIOMAS.map((i) => (
              <Menu.RadioItem key={i.id} value={i.id} lang={i.id} className={ITEM_CLASSE}>
                <span className="num w-[26px] text-[12px] font-semibold text-ink-3">{i.curto}</span>
                <span className="flex-1">{i.nome}</span>
                <Marcado />
              </Menu.RadioItem>
            ))}
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

export function SeletorMoeda({ moeda, onMoeda }: { moeda: Moeda; onMoeda: (m: Moeda) => void }) {
  const atual = MOEDAS.find((m) => m.id === moeda) ?? MOEDAS[0];
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger asChild>
        <button type="button" className="icon-btn w-auto gap-0.5 px-2.5" aria-label={`${t("Moeda")}: ${t(atual.nome)}`} title={t("Moeda")}>
          <span className="num text-[13.5px] font-semibold">{atual.simbolo}</span>
          <CaretDown size={12} weight="bold" aria-hidden="true" />
        </button>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align="end" sideOffset={6} collisionPadding={12} className={`${MENU_CLASSE} min-w-[180px]`} style={MENU_ESTILO}>
          <Menu.RadioGroup value={moeda} onValueChange={(v) => onMoeda(v as Moeda)}>
            {MOEDAS.map((m) => (
              <Menu.RadioItem key={m.id} value={m.id} className={ITEM_CLASSE}>
                <span className="num w-[30px] text-[13px] font-semibold text-ink-3">{m.simbolo}</span>
                <span className="flex-1">{t(m.nome)}</span>
                <Marcado />
              </Menu.RadioItem>
            ))}
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
