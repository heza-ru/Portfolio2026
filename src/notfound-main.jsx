import React from 'react'
import { createRoot } from 'react-dom/client'
import NotFound from './pages/NotFound'

createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <NotFound />
    </React.StrictMode>
)
