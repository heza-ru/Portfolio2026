import { useEffect } from 'react'
import { getPostById } from '../data/logPosts'
import { formatStoryDate } from '../utils/logFormat'
import { LogArticleContent, hasArticleMarkdown } from './logArticleContent'
import './subpage.css'
import './logs-publication.css'
import './log-article.css'

const AUTHOR = 'Mohammad Haider'

function Nav() {
    return (
        <nav className="sp-nav">
            <a href="/" className="sp-nav-back">← haider.digital</a>
            <div className="sp-nav-right">
                <a href="/labs" className="sp-nav-link">Labs</a>
                <a href="/logs" className="sp-nav-link sp-nav-link--on">Logs</a>
            </div>
        </nav>
    )
}

function PageFooter() {
    return (
        <footer className="sp-footer">
            <span>© 2026 Mohammad Haider</span>
            <div className="sp-footer-links">
                <a href="/">Portfolio</a>
                <a href="/labs">Labs</a>
                <a href="https://github.com/heza-ru" target="_blank" rel="noopener noreferrer">GitHub</a>
                <a href="https://www.linkedin.com/in/heza/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            </div>
        </footer>
    )
}

export default function LogArticle({ postId }) {
    const post = Number.isFinite(postId) ? getPostById(postId) : null
    const ok = Boolean(post && post.status === 'published')
    const hasLongform = ok && hasArticleMarkdown(postId)

    useEffect(() => {
        document.title = ok && post
            ? `${post.title} — Mohammad Haider`
            : 'Article — Mohammad Haider'
    }, [ok, post])

    if (!ok) {
        return (
            <div className="logs-page logs-article-page">
                <Nav />
                <div className="sp-wrap">
                    <div className="logs-article__missing-wrap">
                        <p className="logs-article__breadcrumb">
                            <a href="/logs">← Back to Logs</a>
                        </p>
                        <h1 className="logs-article__missing-title">Article unavailable</h1>
                        <p className="logs-article__missing-desc">
                            This story is not published yet, or the link is wrong.
                        </p>
                    </div>
                    <PageFooter />
                </div>
            </div>
        )
    }

    return (
        <div className="logs-page logs-article-page">
            <Nav />

            <div className="sp-wrap">
                {/* ── Header ─────────────────────────────────────────── */}
                <header className="logs-article__head">
                    <p className="logs-article__breadcrumb">
                        <a href="/logs">Logs</a>
                        <span className="logs-article__breadcrumb-sep" aria-hidden="true">/</span>
                        <time dateTime={post.date}>{formatStoryDate(post.date)}</time>
                    </p>

                    <h1 className="logs-article__title">{post.title}</h1>
                    <p className="logs-article__deck">{post.excerpt}</p>

                    <div className="logs-article__meta">
                        <span className="logs-article__meta-line">
                            <span>{AUTHOR}</span>
                            <span className="logs-article__meta-dot" aria-hidden="true">·</span>
                            <time dateTime={post.date}>{formatStoryDate(post.date)}</time>
                            <span className="logs-article__meta-dot" aria-hidden="true">·</span>
                            <span>{post.readTime} read</span>
                        </span>
                        <p className="logs-article__topics">
                            {post.tags.map(tag => (
                                <span key={tag} className="logs-article__topic">{tag}</span>
                            ))}
                        </p>
                    </div>
                </header>

                {/* ── Hero image (above prose, outside markdown) ─────── */}
                {post.image && (
                    <div className="logs-article__hero">
                        <img
                            src={post.image}
                            alt={post.title}
                            className="logs-article__hero-img"
                            loading="eager"
                            decoding="async"
                        />
                    </div>
                )}

                {/* ── Body prose ─────────────────────────────────────── */}
                <article className="logs-article">
                    <div className="logs-article__prose">
                        {hasLongform
                            ? <LogArticleContent postId={postId} />
                            : <p>Full story coming soon.</p>
                        }
                    </div>
                </article>

                <PageFooter />
            </div>
        </div>
    )
}
