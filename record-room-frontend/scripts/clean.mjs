import { rmSync } from 'node:fs';

for (const path of ['dist', 'coverage', '.vite']) {
  rmSync(path, { recursive: true, force: true });
}
console.log('Cleaned build artifacts.');
