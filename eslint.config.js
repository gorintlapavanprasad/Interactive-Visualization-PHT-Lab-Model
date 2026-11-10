// ESLint configuration for the PHT Lab dashboard.
//
//   cd tools && npm run lint     (runs ESLint from the repo root)
//
// The app is plain browser scripts (no bundler) loaded in order by index.html,
// so they share one global scope. To let ESLint catch genuinely undefined
// names, we collect every top-level function/const/let/var declared in the
// app's own files and pass them in as known globals.
const fs = require('fs');
const path = require('path');
// ESLint and its plugins are installed in tools/node_modules.
const { createRequire } = require('module');
const toolsRequire = createRequire(path.join(__dirname, 'tools', 'package.json'));
const js = toolsRequire('@eslint/js');
const globals = toolsRequire('globals');

const ROOT = __dirname;
const APP_DIR = path.join(ROOT, 'assets/js');
const appFiles = fs.readdirSync(APP_DIR).filter(f => f.endsWith('.js') && f !== 'data.js' && f !== 'pagination.js');

const appGlobals = {};
for (const f of appFiles) {
  const src = fs.readFileSync(path.join(APP_DIR, f), 'utf8');
  for (const m of src.matchAll(/^(?:async\s+)?(?:function\s*\*?|const|let|var)\s+([A-Za-z_$][\w$]*)/gm)) appGlobals[m[1]] = 'writable';
}

module.exports = [
  {
    ignores: ['assets/js/data.js', 'assets/js/pagination.js', 'assets/vendor/**', 'tools/node_modules/**', 'tools/ci-artifacts/**', 'tools/a11y-report-*/**']
  },
  {
    files: ['assets/js/**/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        ...globals.jquery,
        Highcharts: 'readonly',
        XLSX: 'readonly',
        Shepherd: 'readonly',
        ...appGlobals
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      // Top-level names are shared between the scripts; only check locals.
      'no-unused-vars': ['error', { vars: 'local', args: 'none', caughtErrors: 'none' }],
      // Our own globals are declared once in their file; don't treat that as redeclaring a builtin.
      'no-redeclare': ['error', { builtinGlobals: false }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Use === / !== (== null is allowed as a null-or-undefined check).
      eqeqeq: ['error', 'smart']
    }
  },
  {
    files: ['tools/**/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      // Test code inside page.evaluate() runs in the browser and uses the app's globals.
      globals: { ...globals.node, ...globals.browser, ...globals.jquery, Highcharts: 'readonly', XLSX: 'readonly', axe: 'readonly', Shepherd: 'readonly', ...appGlobals }
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }]
    }
  }
];
