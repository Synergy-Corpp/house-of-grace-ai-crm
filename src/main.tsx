import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { aiAutomation } from './services/aiAutomation'

// Initialize AI Automation Engine
aiAutomation.initialize().then(() => {
  console.log('🚀 AI Enhanced CRM - Automation Engine initialized');
}).catch(error => {
  console.error('❌ Failed to initialize AI Automation Engine:', error);
});

createRoot(document.getElementById("root")!).render(<App />);
