import { useEffect } from 'react'
import { POSTS } from '../data/logPosts'
import { formatStoryDate } from '../utils/logFormat'
import './subpage.css'
import './logs-publication.css'

const AUTHOR = 'Mohammad Haider'
const FEATURED_STORY_ID = POSTS.find(p => p.status === 'published')?.id ?? null

function LogStory({ post, featured }) {
    const isLive = post.status === 'published'
    const dateLine = formatStoryDate(post.date)
    const href = `/logs/${post.id}`

    if (featured && post.image) {
        return (
            <article
                className="logs-story logs-story--featured"
                itemScope
                itemType="https://schema.org/BlogPosting"
            >
                <a href={href} className="logs-story__cover-link" tabIndex={-1} aria-hidden="true">
                    <div className="logs-story__cover">
                        <picture>
                            <source srcSet={post.image} type="image/avif" />
                            <img
                                src={post.image.replace(/\.avif$/, '.png')}
                                alt=""
                                className="logs-story__cover-img"
                                loading="eager"
                                decoding="async"
                            />
                        </picture>
                    </div>
                </a>

                <div className="logs-story__body">
                    <p className="logs-story__byline">
                        <span itemProp="author" itemScope itemType="https://schema.org/Person">
                            <span itemProp="name">{AUTHOR}</span>
                        </span>
                        <span className="logs-story__byline-sep" aria-hidden="true">·</span>
                        <time dateTime={post.date} itemProp="datePublished">{dateLine}</time>
                        <span className="logs-story__byline-sep" aria-hidden="true">·</span>
                        <span>{post.readTime} read</span>
                    </p>

                    <h2 className="logs-story__title" itemProp="headline">
                        <a href={href}>{post.title}</a>
                    </h2>

                    <p className="logs-story__deck" itemProp="description">{post.excerpt}</p>

                    <div className="logs-story__topics" aria-label="Topics">
                        <span className="logs-story__topics-inner">
                            {post.tags.map(tag => <span key={tag}>{tag}</span>)}
                        </span>
                    </div>

                    <div className="logs-story__read">
                        <a href={href}>Read full story</a>
                    </div>
                </div>
            </article>
        )
    }

    return (
        <article
            className="logs-story"
            itemScope
            itemType="https://schema.org/BlogPosting"
        >
            {/* left column: date stamp */}
            <time
                className="logs-story__date"
                dateTime={post.date}
                itemProp="datePublished"
            >
                {dateLine}
            </time>

            {/* right column: text */}
            <div className="logs-story__body">
                <p className="logs-story__byline">
                    <span itemProp="author" itemScope itemType="https://schema.org/Person">
                        <span itemProp="name">{AUTHOR}</span>
                    </span>
                    <span className="logs-story__byline-sep" aria-hidden="true">·</span>
                    <span>{post.readTime} read</span>
                    {!isLive && (
                        <>
                            <span className="logs-story__byline-sep" aria-hidden="true">·</span>
                            <span className="logs-story__draft-flag">Draft</span>
                        </>
                    )}
                </p>

                <h2 className="logs-story__title" itemProp="headline">
                    {isLive
                        ? <a href={href}>{post.title}</a>
                        : <span className="logs-story__title-text">{post.title}</span>
                    }
                </h2>

                <p className="logs-story__deck" itemProp="description">{post.excerpt}</p>

                <div className="logs-story__topics" aria-label="Topics">
                    <span className="logs-story__topics-inner">
                        {post.tags.map(tag => <span key={tag}>{tag}</span>)}
                    </span>
                </div>

                <div className="logs-story__read">
                    {isLive
                        ? <a href={href}>Read full story</a>
                        : <span className="logs-story__read-soon">Coming soon</span>
                    }
                </div>
            </div>
        </article>
    )
}

export default function Logs() {
    useEffect(() => {
        document.title = 'Logs — Mohammad Haider'
    }, [])

    return (
        <div className="logs-page">
            <nav className="sp-nav">
                <a href="/" className="sp-nav-back">← haider.digital</a>
                <div className="sp-nav-right">
                    <a href="/labs" className="sp-nav-link">Labs</a>
                    <a href="/logs" className="sp-nav-link sp-nav-link--on">Logs</a>
                </div>
            </nav>

            <div className="sp-wrap">
                <header className="logs-masthead">
                    <p className="logs-masthead__label">Writing</p>
                    <h1 className="logs-masthead__title">Logs</h1>
                    <p className="logs-masthead__lede">
                        Notes on building, breaking, and making things. Technical
                        post-mortems, process write-ups, and the occasional opinion.
                    </p>
                </header>

                <main>
                    <div className="logs-feed">
                        {POSTS.map(p => (
                            <LogStory
                                key={p.id}
                                post={p}
                                featured={FEATURED_STORY_ID !== null && p.id === FEATURED_STORY_ID}
                            />
                        ))}
                    </div>
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
        </div>
    )
}
