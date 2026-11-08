// Flat ESLint config. Architecture rule: a feature may import only from `core`,
// its own files, and ANOTHER feature's public `index.ts` (never its internals).
const { defineConfig } = require('eslint/config');
const expoFlat = require('eslint-config-expo/flat');
const boundaries = require('eslint-plugin-boundaries');
const prettier = require('eslint-config-prettier');

module.exports = defineConfig([
  expoFlat,
  prettier,
  { ignores: ['dist/*', '.expo/*', 'node_modules/*', 'coverage/*', 'web-preview/*'] },
  {
    files: ['src/features/**/*.{ts,tsx}', 'src/core/ui/**/*.{ts,tsx}'],
    ignores: ['src/features/**/tests/**', 'src/core/ui/tests/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
          message:
            'Hard-coded hex colours are not allowed in components. Use theme tokens via useTheme().',
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app', partialMatch: false },
        { type: 'core', pattern: 'src/core', partialMatch: false },
        {
          type: 'feature',
          pattern: 'src/features/*',
          partialMatch: false,
          capture: ['featureName'],
        },
      ],
      'import/resolver': {
        typescript: { alwaysTryTypes: true, project: './tsconfig.json' },
      },
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            // app wires everything: core + any feature's public index.ts + feature.manifest.ts
            {
              from: { element: { type: 'app' } },
              allow: {
                to: [
                  { element: { type: 'core' } },
                  { element: { type: 'feature', fileInternalPath: 'index.ts' } },
                  { element: { type: 'feature', fileInternalPath: 'feature.manifest.ts' } },
                ],
              },
            },
            // feature -> core
            {
              from: { element: { type: 'feature' } },
              allow: { to: { element: { type: 'core' } } },
            },
            // feature -> its own files
            {
              from: { element: { type: 'feature' } },
              allow: {
                to: {
                  element: {
                    type: 'feature',
                    captured: { featureName: '{{ from.element.captured.featureName }}' },
                  },
                },
              },
            },
            // feature -> another feature: public index.ts only
            {
              from: { element: { type: 'feature' } },
              allow: { to: { element: { type: 'feature', fileInternalPath: 'index.ts' } } },
            },
            // core -> core only (implicit: same-element imports are not checked)
          ],
        },
      ],
    },
  },
  // Tests may assemble the whole app (test database helper lives in src/app/testing).
  {
    files: ['src/**/tests/**/*.{ts,tsx}'],
    rules: { 'boundaries/dependencies': 'off' },
  },
  // React Compiler advisory rules: these modules deliberately keep "latest value" refs and reset
  // derived state in effects (timers, audio callbacks). Behaviour is covered by tests.
  {
    files: [
      'src/features/board/ui/BoardScreen.tsx',
      'src/features/composer/ui/useComposer.ts',
      'src/core/app/useLoad.ts',
      'src/app/screens/ChildBoardScreen.tsx',
    ],
    rules: {
      'react-hooks/refs': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);
