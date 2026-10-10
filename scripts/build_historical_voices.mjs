import { createHash } from 'node:crypto';
import { mkdir, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { dialogueVoiceLines } from '../src/historical-sf/dialogue.ts';

const output = 'public/historical-sf/voices';
await mkdir(output, { recursive: true });
const temporary = await mkdtemp(join(tmpdir(), 'historical-voices-'));
const manifest = {};
try {
  for (const { role, text } of dialogueVoiceLines) {
    if (manifest[text]) continue;
    const id = createHash('sha256').update(text).digest('hex').slice(0, 16);
    const voice = role === 'flowers' ? 'Samantha' : 'Daniel';
    const file = join(temporary, `${id}.aiff`);
    execFileSync('say', ['-v', voice, '-r', '165', '-o', file, text]);
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', file, '-ac', '1', '-ar', '24000', '-codec:a', 'libmp3lame', '-b:a', '64k', `${output}/${id}.mp3`]);
    const duration = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', `${output}/${id}.mp3`], { encoding: 'utf8' }).trim());
    manifest[text] = { path: `/historical-sf/voices/${id}.mp3`, duration, voice };
  }
  await writeFile('src/historical-sf/voice-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
  await writeFile(`${output}/README.md`, '# Street dialogue\n\nOriginal fictional dialogue, synthesized locally with macOS Daniel and Samantha voices. These are not historical recordings. No external speech service is used.\n\nRun `node --experimental-transform-types scripts/build_historical_voices.mjs` on macOS with FFmpeg installed to rebuild the clips and manifest.\n');
  console.log(`Built ${Object.keys(manifest).length} voice clips.`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
