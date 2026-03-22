import { useEffect } from 'react'
import './subpage.css'

const PROJECTS = [
    {
        id: 1,
        index: '01',
        title: 'Tuneminal',
        category: 'CLI',
        tech: 'Go',
        year: '2025',
        description: 'A lightweight open-source karaoke machine for your terminal. Play songs, follow real-time scrolling lyrics, and sing from the command line — with live audio visualisation and karaoke scoring. No GUI required.',
        tags: ['Go', 'Audio', 'CLI', 'Open Source'],
        link: 'https://github.com/heza-ru/Tuneminal',
        comingSoon: false,
    },
    {
        id: 2,
        index: '02',
        title: 'Netstalgia',
        category: 'Web App',
        tech: 'Next.js',
        year: '2025',
        description: 'A lovingly cursed 90s-style web app that loads like dial-up. Complete with pixel-art loading bars, pop-up ads, a fully functional guestbook, a Windows 95 desktop environment, and the iconic dancing baby GIF.',
        tags: ['Next.js', 'TypeScript', 'Nostalgia', 'Design'],
        link: 'https://netstalgia.netlify.app',
        comingSoon: false,
    },
    {
        id: 3,
        index: '03',
        title: 'CallScribe',
        category: 'Browser Extension',
        tech: 'React',
        year: '2025',
        description: 'A Chromium extension that extracts Mindtickle call transcripts and converts them into structured JIRA tickets and Productboard insights via Claude AI — with a single click from your sales workflow.',
        tags: ['React', 'Claude AI', 'Browser Extension', 'Sales Ops'],
        link: 'https://github.com/heza-ru/CallScribe',
        comingSoon: false,
    },
    {
        id: 4,
        index: '04',
        title: 'Project Localhost',
        category: 'Infrastructure',
        tech: 'Raspberry Pi 5',
        year: '2026',
        description: 'A Raspberry Pi 5 local infrastructure stack running Pi-hole for DNS resolution, Home Assistant for automation, and a fully self-hosted LLM — entirely on your own hardware, zero cloud dependency.',
        tags: ['Raspberry Pi', 'Self-hosted', 'Infrastructure', 'LLM'],
        link: 'https://github.com/heza-ru/Project-Localhost',
        comingSoon: true,
    },
]

function ProjectCard({ project }) {
    return (
        <li className="sp-item">
            <div className="sp-item-meta">
                <span>{project.index}</span>
                <span>{project.year}</span>
            </div>

            <h2 className="sp-item-title">{project.title}</h2>
            <p className="sp-item-cat">{project.category} · {project.tech}</p>
            <p className="sp-item-desc">{project.description}</p>

            <div className="sp-tags">
                {project.tags.map(tag => (
                    <span key={tag} className="sp-tag">{tag}</span>
                ))}
            </div>

            {project.comingSoon ? (
                <span className="sp-item-soon">Coming Soon</span>
            ) : (
                <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sp-item-cta"
                >
                    View Project ↗
                </a>
            )}
        </li>
    )
}

export default function Labs() {
    useEffect(() => {
        document.title = 'Labs — Mohammad Haider'
    }, [])

    return (
        <>
            <nav className="sp-nav">
                <a href="/" className="sp-nav-back">← haider.digital</a>
                <div className="sp-nav-right">
                    <a href="/labs" className="sp-nav-link sp-nav-link--on">Labs</a>
                    <a href="/logs" className="sp-nav-link">Logs</a>
                </div>
            </nav>

            <div className="sp-wrap">
                <header className="sp-hero">
                    <p className="sp-hero-eyebrow">Mohammad Haider · Selected Work</p>
                    <h1 className="sp-hero-title">Labs.</h1>
                    <p className="sp-hero-sub">
                        Experiments, tools, and open-source work — things built out of
                        curiosity, necessity, or the sheer pleasure of making something real.
                    </p>
                </header>

                <main>
                    <ul className="sp-list">
                        {PROJECTS.map(p => <ProjectCard key={p.id} project={p} />)}
                    </ul>
                </main>

                <footer className="sp-footer">
                    <span>© 2026 Mohammad Haider</span>
                    <div className="sp-footer-links">
                        <a href="/">Portfolio</a>
                        <a href="/logs">Logs</a>
                        <a href="https://github.com/heza-ru" target="_blank" rel="noopener noreferrer">GitHub</a>
                        <a href="https://www.linkedin.com/in/heza/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                    </div>
                </footer>
            </div>
        </>
    )
}
