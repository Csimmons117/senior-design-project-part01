import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(<App />)

// register PWA (VitePWA auto-generates /sw.js)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.catch(() => {}).then(() => {
    console.log('Service worker ready')
  }).catch(()=>{})
}