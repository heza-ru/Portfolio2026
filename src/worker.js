export default {
    async fetch(request, env) {
        const url = new URL(request.url)

        // Redirect www to the canonical non-www domain
        if (url.hostname.startsWith('www.')) {
            url.hostname = url.hostname.slice(4)
            return Response.redirect(url.toString(), 301)
        }

        return env.ASSETS.fetch(request)
    },
}
