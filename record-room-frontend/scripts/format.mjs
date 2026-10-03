import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const args = process.argv.slice(2);
const check = args.includes('--check');
const explicit = args.filter((arg) => arg !== '--check');
// Directories are optional: `docs/` lives at the repository root, not here.
const defaults = ['src', 'scripts', 'docs', 'public', '*.config.*', '*.ts', '*.js', '*.json'];
const targets = (explicit.length ? explicit : defaults).filter(
  (target) => target.includes('*') || existsSync(target),
);

if (targets.length === 0) {
  console.error('One or more formatter targets do not exist.');
  process.exit(1);
}

const cli = ['prettier', check ? '--check' : '--write', '--ignore-path', '.gitignore', ...targets];

if (explicit.length && targets.length !== explicit.length) {
  console.error('One or more formatter targets do not exist.');
  process.exit(1);
}

execFileSync('pnpm', ['exec', ...cli], { stdio: 'inherit', shell: process.platform === 'win32' });
