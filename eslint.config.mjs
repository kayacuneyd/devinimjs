import js from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';

/** Browser globals the runtime legitimately touches (no-undef guards typos on everything else). */
const browserGlobals = {
  console: 'readonly',
  queueMicrotask: 'readonly',
  document: 'readonly',
  customElements: 'readonly',
  HTMLElement: 'readonly',
  Element: 'readonly',
  Node: 'readonly',
  CustomEvent: 'readonly',
  KeyboardEvent: 'readonly',
  URL: 'readonly',
  setTimeout: 'readonly',
};

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    plugins: { jsdoc },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: browserGlobals,
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'jsdoc/require-jsdoc': [
        'warn',
        {
          publicOnly: true,
          require: {
            ClassDeclaration: true,
            FunctionDeclaration: true,
            MethodDefinition: true,
          },
        },
      ],
      'jsdoc/require-param': 'warn',
      'jsdoc/require-returns': 'warn',
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...browserGlobals, globalThis: 'readonly' },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { console: 'readonly', process: 'readonly', URL: 'readonly', Buffer: 'readonly' },
    },
  },
  {
    ignores: ['node_modules/', 'dist/', 'coverage/'],
  },
];
