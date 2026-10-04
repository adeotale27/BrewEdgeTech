(() => {
  let publishedContentRequest

  window.getPublishedSiteContent = () => {
    if (!publishedContentRequest) {
      publishedContentRequest = fetch('/api/site-content', { cache: 'no-store' })
        .then((response) => {
          if (!response.ok) throw new Error(`Site content request failed (${response.status})`)
          return response.json()
        })
        .then((data) => {
          if (!data || typeof data.content !== 'object' || data.content === null) {
            throw new Error('Site content response did not contain published content.')
          }
          return data.content
        })
        .catch((error) => {
          publishedContentRequest = undefined
          throw error
        })
    }
    return publishedContentRequest
  }
})()
