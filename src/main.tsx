import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		const viteBase = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL;
		const basePath = viteBase || '/creatine-tracker/';
		const swUrl = `${basePath}service-worker.js`;
		navigator.serviceWorker.register(swUrl).catch((error) => {
			console.warn('Service worker registration failed', error);
		});
	});
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
