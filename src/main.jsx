import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import '@fontsource-variable/inter';
import 'bootstrap/dist/css/bootstrap-grid.min.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/ui.css';
import './styles/public.css';
import './styles/admin.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="bottom-center" toastOptions={{ style: { borderRadius: 40, background: '#151515', color: '#fff', fontSize: 14 } }} />
    </BrowserRouter>
  </StrictMode>
);
