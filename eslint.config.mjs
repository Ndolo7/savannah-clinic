import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  globalIgnores(['.next/**', 'node_modules/**', 'next-env.d.ts']),
  {
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'off', // Data-fetch effects intentionally set loading and response state from external requests.
      '@next/next/no-img-element': 'off', // DummyJSON supplies image URLs and the UI needs direct thumbnail control.
    },
  },
]);
