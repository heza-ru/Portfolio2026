import React from 'react'
import { createRoot } from 'react-dom/client'
import Logs from './pages/Logs'

createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Logs />
    </React.StrictMode>
)
