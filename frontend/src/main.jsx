import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import 'semantic-ui-css/semantic.min.css'
import './index.css'
import App from './App.jsx'

createRoot(document.querySelector('#root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
