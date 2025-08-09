import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';

export default defineConfig([
  {
    ignores: ['dist/*', '.claude-flow/*', '.claude/*', '.roo/*'],
  },
  expoConfig,
  {
    rules: {
      'react/display-name': 'off',
    },
  },
]);
