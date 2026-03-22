import { useEffect } from 'react'
import './subpage.css'

const POSTS = [
    {
        id: 1,
        date: '2026-03-10',
        dateDisplay: '2026.03.10',
        title: 'This Portfolio: Building a Cinematic Web Experience',
        excerpt: 'A deep-dive into building a full 3D portfolio with Three.js, GSAP ScrollTrigger, custom cursor mechanics, Matter.js physics in the footer, and real-time generative effects — deployed to Cloudflare Workers. What worked, what broke, and the tradeoffs that shaped every decision.',
        tags: ['Three.js', 'GSAP', 'React', 'Vite', 'Cloudflare'],
        readTime: '8 min',
        status: 'published',
    },
    {
        id: 2,
        date: '2025-11-15',
        dateDisplay: '2025.11.15',
        title: 'Building Tuneminal: Real-time Audio in the Terminal',
        excerpt: 'How I built a Go-based karaoke engine with synchronized scrolling lyrics, real-time audio visualisation, and a scoring system — entirely in the terminal, without a single GUI framework. The surprising difficulty of syncing audio playback to rendered frames at 60fps.',
        tags: ['Go', 'Audio', 'CLI', 'Open Source'],
        readTime: '6 min',
        status: 'draft',
    },
    {
        id: 3,
        date: '2025-10-28',
        dateDisplay: '2025.10.28',
        title: 'The Joy of Building Ugly: A Netstalgia Post-Mortem',
        excerpt: "Deliberately building something terrible is surprisingly hard. A post-mortem on recreating the full 1999 dial-up experience — blinking cursors, pop-ups, a functional guestbook, and a Windows 95 desktop environment in Next.js. Why constraints in the wrong direction are liberating.",
        tags: ['Next.js', 'Design', 'Nostalgia', 'UX'],
        readTime: '5 min',
        status: 'draft',
    },
    {
        id: 4,
        date: '2025-09-12',
        dateDisplay: '2025.09.12',
        title: 'CallScribe: Turning Sales Calls into Structured Work with Claude AI',
        excerpt: 'Building a browser extension that extracts Mindtickle call transcripts and converts them into JIRA tickets and Productboard insights via Claude. The unexpected challenges of building on top of a live SaaS platform — DOM instability, auth interception, and prompt engineering for structured output.',
        tags: ['AI', 'React', 'Browser Extension', 'Claude'],
        readTime: '7 min',
        status: 'draft',
    },
    {
        id: 5,
        date: '2026-01-08',
        dateDisplay: '2026.01.08',
        title: 'Project Localhost: Self-hosting Everything on a Raspberry Pi 5',
        excerpt: 'Building a home infrastructure stack — Pi-hole for DNS, Home Assistant for automation, and a locally-running LLM. What works, what breaks, and why cloud dependency is entirely optional for most personal compute. Including a benchmarked comparison of local vs cloud inference latency.',
        tags: ['Raspberry Pi', 'Self-hosted', 'LLM', 'Infrastructure'],
        readTime: '10 min',
        status: 'draft',
    },
]

function LogEntry({ post }) {
    const isLive = post.status === 'published'

    return (
        <li className="sp-item">
            <div className="sp-item-meta">
                <span>{post.dateDisplay}</span>
                <span
                    className={`sp-item-badge ${isLive ? 'sp-item-badge--live' : 'sp-item-badge--draft'}`}
                >
                    {isLive ? 'Published' : 'Draft'}
                </span>
            </div>

            <h2 className="sp-item-title">{post.title}</h2>
            <p className="sp-item-cat">{post.readTime} read</p>
            <p className="sp-item-desc">{post.excerpt}</p>

            <div className="sp-tags">
                {post.tags.map(tag => (
                    <span key={tag} className="sp-tag">{tag}</span>
                ))}
            </div>

            {isLive ? (
                <a href={`/logs/${post.id}`} className="sp-item-cta">Read →</a>
            ) : (
                <span className="sp-item-soon">Coming Soon</span>
            )}
        </li>
    )
}

export default function Logs() {
    useEffect(() => {
        document.title = 'Logs — Mohammad Haider'
    }, [])

    return (
        <>
            <nav className="sp-nav">
                <a href="/" className="sp-nav-back">← haider.digital</a>
                <div className="sp-nav-right">
                    <a href="/labs" className="sp-nav-link">Labs</a>
                    <a href="/logs" className="sp-nav-link sp-nav-link--on">Logs</a>
                </div>
            </nav>

            <div className="sp-wrap">
                <header className="sp-hero">
                    <p className="sp-hero-eyebrow">Mohammad Haider · Writing</p>
                    <h1 className="sp-hero-title">Logs.</h1>
                    <p className="sp-hero-sub">
                        Notes on building, breaking, and making things. Technical
                        post-mortems, process write-ups, and the occasional opinion.
                    </p>
                </header>

                <main>
                    <ul className="sp-list">
                        {POSTS.map(p => <LogEntry key={p.id} post={p} />)}
                    </ul>
                </main>

                <footer className="sp-footer">
                    <span>© 2026 Mohammad Haider</span>
                    <div className="sp-footer-links">
                        <a href="/">Portfolio</a>
                        <a href="/labs">Labs</a>
                        <a href="https://github.com/heza-ru" target="_blank" rel="noopener noreferrer">GitHub</a>
                        <a href="https://www.linkedin.com/in/heza/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                    </div>
                </footer>
            </div>
        </>
    )
}
