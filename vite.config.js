import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { yamlPlugin } from 'vite-yaml-plugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', { target: '18', runtimeModule: 'react-compiler-runtime' }]],
      },
    }),
    yamlPlugin(),
  ],
  server: {
    port: 3000,
  },
})
