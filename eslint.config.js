// Flat ESLint config. Architecture rule: a feature may import only from `core`,
// its own files, and ANOTHER feature's public `index.ts` (never its internals).
const { defineConfig } = require('eslint/config');
const expoFlat = require('eslint-config-expo/flat');
const boundaries = require('eslint-plugin-boundaries');

module.exports = defineConfig([
  expoFlat,
  { ignores: ['dist/*', '.expo/*', 'node_modules/*', 'coverage/*'] },
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
            // app wires everything: core + any feature's public index.ts
            {
              from: { element: { type: 'app' } },
              allow: {
                to: [
                  { element: { type: 'core' } },
                  { element: { type: 'feature', fileInternalPath: 'index.ts' } },
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
]);
