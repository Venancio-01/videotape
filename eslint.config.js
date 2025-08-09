/* eslint-env node */
import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';

export default defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.claude-flow/*', '.claude/*', '.roo/*'],
  },
  {
    rules: {
      'react/display-name': 'off',
    },
  },
]);
