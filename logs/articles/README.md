# Logs articles (content + images)

Add and edit posts here. Built pages (`logs/1/index.html`, etc.) load markdown from this folder.

## Layout

```text
logs/articles/
  README.md          ← you are here
  1/
    article.md       ← body (Markdown)
    images/          ← optional: screenshots, diagrams (any filename)
  2/
    article.md
    images/
```

- **One folder per numeric post id** — the id must match `id` in `src/data/logPosts.js` and the URL `/logs/{id}/`.
- **Body file** must be named exactly `article.md`. At build time Vite bundles it into the JS bundle (it is not served as a separate `.md` file on the site).
- **Images** live under `images/`. In markdown, reference them with a **relative** path so URLs rewrite correctly:

```markdown
![Architecture sketch](./images/architecture.png)
```

That becomes `/logs/articles/1/images/architecture.png` in the browser.

## Checklist when publishing a new story

1. Add metadata in `src/data/logPosts.js` (`id`, `status: 'published'`, title, excerpt, …).
2. Create `logs/articles/{id}/article.md` (and `images/` if needed).
3. Copy `logs/1/index.html` → `logs/{id}/index.html` and edit `<title>`, description, canonical, Open Graph.
4. Rebuild (`npm run build`). Vite picks up new article HTML entries from published ids; images are copied into `dist/logs/articles/{id}/images/`.

Long-form UI appears automatically when `article.md` exists for that id.
