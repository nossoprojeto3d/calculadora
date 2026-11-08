import { ArrowUpRight } from "@phosphor-icons/react";

/* Banner discreto de parceiro (link de afiliado), abaixo do orçamento.
   O clique é medido pelo medicao.js via data-evento (sem mexer no arquivo). */
const VOOLT = {
  url: "https://afiliado.c2cseller.com/voolt3d-nosso-projeto-b0e5828bb12818a1",
  cupom: "NOSSOPROJETO",
};

export function Parceiro() {
  return (
    <a
      href={VOOLT.url}
      target="_blank"
      rel="sponsored noopener"
      data-evento="clique_afiliado"
      data-parceiro="voolt3d"
      aria-label={`Até 8% de desconto em filamentos na Voolt3D com o cupom ${VOOLT.cupom} (abre em nova aba)`}
      className="parceiro rp-hide3 group mt-3 flex min-h-[52px] items-center gap-3 rounded-2xl border border-line bg-surface-2 px-3 py-2 transition-colors hover:border-accent-line lg:mt-0"
    >
      {/* fundo branco fixo: a logo é roxa e some no tema escuro */}
      <span className="flex h-9 w-[96px] flex-none items-center justify-center rounded-lg bg-white px-2">
        <img src={`${import.meta.env.BASE_URL}assets/voolt3d.webp`} alt="" width={640} height={162}
          className="h-auto w-full" loading="lazy" decoding="async" />
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-[13.5px] font-medium text-ink">Até 8% off em filamentos</span>
        <span className="block text-[12.5px] text-ink-3">
          cupom <span className="mono font-medium text-accent-text">{VOOLT.cupom}</span>
        </span>
      </span>
      <ArrowUpRight size={16} weight="bold" aria-hidden
        className="flex-none text-ink-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-text" />
    </a>
  );
}
