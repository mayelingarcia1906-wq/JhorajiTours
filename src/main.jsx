import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Aplicar el color guardado globalmente antes de que cargue React
try {
  const savedSettings = localStorage.getItem('jhoraji_settings');
  if (savedSettings) {
    const parsed = JSON.parse(savedSettings);
    if (parsed.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', parsed.primaryColor);
    }
  }
} catch (e) {
  console.error('Error loading settings', e);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
