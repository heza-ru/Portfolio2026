import React from 'react'
import { createRoot } from 'react-dom/client'
import LogArticle from './pages/LogArticle'

function parsePostIdFromPath() {
    const path = (window.location.pathname || '/').replace(/\/+$/, '') || '/'
    const m = path.match(/^\/logs\/(\d+)$/)
    return m ? Number(m[1]) : NaN
}

const postId = parsePostIdFromPath()

createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <LogArticle postId={postId} />
    </React.StrictMode>,
)
