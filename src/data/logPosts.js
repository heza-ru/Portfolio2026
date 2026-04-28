/** Log listing + metadata (single source of truth for Logs and LogArticle). */

export const POSTS = [
    {
        id: 7,
        date: '2026-04-28',
        dateDisplay: '2026.04.28',
        title: "Hermes vs OpenClaw: The AI Agent Showdown That's Splitting the Builder Community",
        excerpt:
            'Hermes Agent (Nous Research) and OpenClaw embody two answers to what an AI agent should be: one that improves with experience versus one that orchestrates tools from day one. Benchmarks, operational tradeoffs, security, and why teams are pairing both.',
        tags: ['AI Agents', 'Hermes', 'OpenClaw', 'Nous Research', 'Developer Tools', 'Security'],
        readTime: '15 min',
        image: '/logs/articles/7/images/hero.avif',
        status: 'published',
    },
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

export function getPostById(id) {
    return POSTS.find(p => p.id === id) ?? null
}

/** Numeric ids that have a built article page (`logs/{id}/index.html`). */
export function getPublishedArticleIds() {
    return POSTS.filter(p => p.status === 'published').map(p => p.id)
}
