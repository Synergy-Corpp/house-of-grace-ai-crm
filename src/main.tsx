import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { aiAutomation } from './services/aiAutomation'

// Initialize AI Automation Engine (non-blocking)
try {
  aiAutomation.initialize().then(() => {
    console.log('🚀 AI Enhanced CRM - Automation Engine initialized');
  }).catch(error => {
    console.warn('⚠️ AI Automation Engine initialization skipped:', error.message);
  });
} catch (error) {
  console.warn('⚠️ AI Automation Engine not available');
}

// Always render the app regardless of automation engine status
createRoot(document.getElementById("root")!).render(<App />);
