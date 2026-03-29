import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
	return {
		base: '/creatine-tracker/',
		plugins: [react(), tailwindcss()],
		resolve: {
			alias: {
				'@': path.resolve(__dirname, '.'),
			},
		},
		server: {
			// Keep this switch to disable HMR in constrained environments.
			hmr: process.env.DISABLE_HMR !== 'true',
		},
		build: {
			target: 'es2020',
			cssCodeSplit: true,
			rollupOptions: {
				output: {
					manualChunks: {
						motion: ['motion/react'],
					},
				},
			},
		},
	};
});
