import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const args = process.argv.slice(2);
const check = args.includes('--check');
const explicit = args.filter((arg) => arg !== '--check');
const targets = explicit.length
  ? explicit
  : ['src', 'scripts', 'docs', 'public', '*.config.*', '*.ts', '*.js', '*.json'];
const cli = ['prettier', check ? '--check' : '--write', '--ignore-path', '.gitignore', ...targets];

if (explicit.length && explicit.some((target) => !existsSync(target))) {
  console.error('One or more formatter targets do not exist.');
  process.exit(1);
}

execFileSync('pnpm', ['exec', ...cli], { stdio: 'inherit', shell: process.platform === 'win32' });
