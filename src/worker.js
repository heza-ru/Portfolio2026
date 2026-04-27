export default {
    async fetch(request, env) {
        const url = new URL(request.url)

        // Redirect www to the canonical non-www domain
        if (url.hostname.startsWith('www.')) {
            url.hostname = url.hostname.slice(4)
            return Response.redirect(url.toString(), 301)
        }

        const path = url.pathname.replace(/\/$/, '') || '/'
        const logArticle = path.match(/^\/logs\/(\d+)$/)
        if (logArticle) {
            const assetPath = `/logs/${logArticle[1]}/index.html`
            const assetUrl = new URL(assetPath + url.search, url.origin)
            return env.ASSETS.fetch(new Request(assetUrl, request))
        }

        return env.ASSETS.fetch(request)
    },
}
