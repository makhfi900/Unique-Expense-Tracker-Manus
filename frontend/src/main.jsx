import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.jsx'  // Old custom JWT auth
import SupabaseApp from './SupabaseApp.jsx'  // New Supabase auth

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SupabaseApp />
  </StrictMode>,
)
