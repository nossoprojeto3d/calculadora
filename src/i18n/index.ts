/* Junta as traduções de cada parte do app. Cada linha: [pt-PT, es, en]. */
import type { Traducoes } from "./tipos";
import { geral } from "./geral";
import { telas } from "./telas";
import { resultado } from "./resultado";
import { calculo } from "./calculo";
import { pdf } from "./pdf";

export const TRADUCOES: Traducoes = { ...geral, ...telas, ...resultado, ...calculo, ...pdf };
