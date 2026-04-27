import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getArticleMarkdown, rewriteRelativeMediaPaths } from './logArticleSources'

/** Drop remark/hast props that must not reach the DOM. */
function mdProps(props) {
    const { node: _node, children, ...rest } = props
    return { children, ...rest }
}

const markdownComponents = {
    h1: props => <h1 className="logs-article__h1" {...mdProps(props)} />,
    h2: props => <h2 className="logs-article__h2" {...mdProps(props)} />,
    h3: props => <h3 className="logs-article__h3" {...mdProps(props)} />,
    p: props => <p className="logs-article__p" {...mdProps(props)} />,
    strong: props => <strong className="logs-article__strong" {...mdProps(props)} />,
    em: props => <em className="logs-article__em" {...mdProps(props)} />,
    ul: props => <ul className="logs-article__ul" {...mdProps(props)} />,
    ol: props => <ol className="logs-article__ol" {...mdProps(props)} />,
    li: props => <li {...mdProps(props)} />,
    blockquote: props => (
        <blockquote className="logs-article__quote" {...mdProps(props)} />
    ),
    hr: () => <hr className="logs-article__hr" />,
    a: ({ href, children }) => {
        const external = typeof href === 'string' && href.startsWith('http')
        return (
            <a
                className="logs-article__a"
                href={href}
                {...(external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
            >
                {children}
            </a>
        )
    },
    pre: props => <pre className="logs-article__pre" {...mdProps(props)} />,
    code(props) {
        const { className, children, ...rest } = mdProps(props)
        const isFence = Boolean(
            className && String(className).includes('language-'),
        )
        if (isFence) {
            return (
                <code className={className} {...rest}>
                    {children}
                </code>
            )
        }
        return (
            <code className="logs-article__code" {...rest}>
                {children}
            </code>
        )
    },
    img: ({ src, alt, title }) => (
        <figure className="logs-article__figure">
            <img
                className="logs-article__img"
                src={src}
                alt={alt ?? ''}
                title={title}
                loading="lazy"
                decoding="async"
            />
        </figure>
    ),
    table: props => (
        <div className="logs-article__table-wrap">
            <table className="logs-article__table" {...mdProps(props)} />
        </div>
    ),
    thead: props => <thead {...mdProps(props)} />,
    tbody: props => <tbody {...mdProps(props)} />,
    tr: props => <tr {...mdProps(props)} />,
    th: props => <th {...mdProps(props)} />,
    td: props => <td {...mdProps(props)} />,
}

export function LogArticleContent({ postId }) {
    const raw = getArticleMarkdown(postId)
    if (raw == null) {
        return null
    }
    const md = rewriteRelativeMediaPaths(raw, postId)
    return (
        <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {md}
        </Markdown>
    )
}

export function hasArticleMarkdown(postId) {
    return getArticleMarkdown(postId) != null
}
