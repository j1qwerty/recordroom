import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

const nodeGlobals = {
  console: 'readonly',
  process: 'readonly',
  URL: 'readonly',
  Buffer: 'readonly',
  fetch: 'readonly',
};

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '.netlify'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
  {
    files: ['scripts/**/*.{js,mjs,cjs}', '*.config.{js,mjs,cjs}', 'vite.config.ts'],
    languageOptions: { globals: nodeGlobals },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
);
