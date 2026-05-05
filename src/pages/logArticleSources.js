/**
 * Bundles `logs/articles/{id}/article.md` at build time.
 * Images are not imported here — keep them in `logs/articles/{id}/images/` (see README there).
 */

const modules = import.meta.glob('../../logs/articles/*/article.md', {
    query: '?raw',
    import: 'default',
    eager: true,
})

const byId = Object.fromEntries(
    Object.entries(modules).flatMap(([path, text]) => {
        const normalized = path.replace(/\\/g, '/')
        const m = normalized.match(/articles\/(\d+)\/article\.md$/)
        return m ? [[Number(m[1]), text]] : []
    }),
)

export function getArticleMarkdown(postId) {
    return byId[postId] ?? null
}

/** Text of the first `#` heading if it is the first non-empty line; otherwise null. */
export function longformLeadingH1Text(markdown) {
    if (markdown == null) return null
    for (const line of String(markdown).split('\n')) {
        const t = line.trim()
        if (!t) continue
        if (t.startsWith('##')) return null
        const m = t.match(/^#\s+(.+)$/)
        return m ? m[1].trim() : null
    }
    return null
}

/** Turn `./images/foo.png` into site-root URLs for the browser. */
export function rewriteRelativeMediaPaths(markdown, postId) {
    return String(markdown)
        .replace(/\]\(\.\/images\//g, `](/logs/articles/${postId}/images/`)
        .replace(/\]\(images\//g, `](/logs/articles/${postId}/images/`)
}
