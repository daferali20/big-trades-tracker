import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.', // تحديد جذر المشروع
  build: {
    outDir: 'dist',
  },
});
