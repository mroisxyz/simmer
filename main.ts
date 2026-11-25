// main.ts — hello to the output slot: copy the game and its capture-ready shots,
// then let the vendored dossier builder batch the orders into one dossier.
// Nothing here reaches the network; the kitchen stays exactly where it was authored.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url)).replace(/[\\/]$/, '');
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

if (!existsSync(join(here, 'game', 'index.html'))) {
  throw new Error('main.ts: missing game/index.html in ' + here);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });

const shotSource = join(here, 'screenshots');
const shotTarget = join(out, 'screenshots');
mkdirSync(shotTarget, { recursive: true });
if (existsSync(shotSource)) {
  cpSync(shotSource, shotTarget, { recursive: true });
}

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

writeFileSync(join(out, 'dossier.json'), dossier);
console.log('simmer-and-serve: wrote dossier.json to ' + out);
