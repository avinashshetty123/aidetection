import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Error boundary for the entire app
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);

try {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  rootElement.innerHTML = `
    <div style="
      min-height: 100vh; 
      background-color: #0f172a; 
      color: white; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      padding: 20px;
      text-align: center;
    ">
      <div>
        <h1 style="font-size: 24px; margin-bottom: 16px;">TRUVOICE</h1>
        <p style="color: #94a3b8; margin-bottom: 16px;">Real-Time Deepfake Detection</p>
        <p style="color: #ef4444;">Failed to load application. Please refresh the page.</p>
        <button 
          onclick="window.location.reload()" 
          style="
            background-color: #3b82f6; 
            color: white; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 8px; 
            cursor: pointer; 
            margin-top: 16px;
          "
        >
          Refresh Page
        </button>
      </div>
    </div>
  `;
}
