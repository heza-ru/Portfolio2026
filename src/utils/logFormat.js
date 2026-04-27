export function formatStoryDate(isoDate) {
    const d = new Date(`${isoDate}T12:00:00`)
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}
