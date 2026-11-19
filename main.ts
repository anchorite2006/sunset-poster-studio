// Sunset Poster Studio — the program that hands the entry in.
// Runs on Node 22 with the standard library only. It takes this repo's
// app/ folder and screenshots/ folder, lays them out under the output
// directory, and writes the dossier the judge reads, built with the
// vendored make.fun library (vendor/makefun-app.ts, untouched).
//
// Try the app first with `node serve.ts`, then open http://localhost:8080.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');

mkdirSync(outputDir, { recursive: true });
cpSync(appDir, join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });

// The scorer's own caps: the dossier text stays under 160 KiB, at most four
// screenshots of 256 KiB each, app/ under 993 files and 48 MiB in total,
// and no app/ path longer than 1000 bytes — all counted beside /output's
// own 1000-entry, 64 MiB ceiling.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
