import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist', 'prototipo'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: { ecmaVersion: 2023, globals: globals.browser, parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' } },
    plugins: { 'react-hooks': reactHooks },
    rules: { ...reactHooks.configs.recommended.rules, 'react-hooks/refs': 'warn', 'react-hooks/set-state-in-effect': 'warn', 'react-hooks/purity': 'warn', 'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }] },
  },
];
