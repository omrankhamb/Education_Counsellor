import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Bootstrap CSS & JS bundle for carousel / tooltips
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// Global custom styles
const style = document.createElement('style')
style.textContent = `
  * { box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #F5F7FA; color: #1E293B; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #F5F7FA; }
  ::-webkit-scrollbar-thumb { background: #C5CAE9; border-radius: 3px; }
  .btn { transition: all 0.2s ease; }
  .card { transition: all 0.25s ease; }
  .carousel-item { transition: transform 0.6s ease-in-out; }
`
document.head.appendChild(style)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
