import { useEffect } from 'react'
import './subpage.css'

export default function NotFound() {
    useEffect(() => {
        document.title = '404 — Mohammad Haider'
    }, [])

    return (
        <>
            <nav className="sp-nav">
                <a href="/" className="sp-nav-back">← haider.digital</a>
                <div className="sp-nav-right">
                    <a href="/labs" className="sp-nav-link">Labs</a>
                    <a href="/logs" className="sp-nav-link">Logs</a>
                </div>
            </nav>

            <div className="sp-wrap nf-wrap">
                <div className="nf-body">
                    <p className="nf-code">404</p>
                    <h1 className="nf-title">Page not<br />found.</h1>
                    <p className="nf-sub">
                        This page doesn't exist or was moved. Head back to the portfolio.
                    </p>
                    <a href="/" className="nf-cta">← Back to Portfolio</a>
                </div>
            </div>
        </>
    )
}
