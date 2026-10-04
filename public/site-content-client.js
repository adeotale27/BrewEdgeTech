(() => {
  let publishedContentRequest

  function showContentUnavailableState() {
    if (document.body.classList.contains('siteContentUnavailable')) return
    document.body.classList.add('siteContentUnavailable')

    const heading = document.querySelector('.hero h1')
    const description = document.querySelector('.hero .lead')
    const actions = document.querySelector('.hero .actions')
    if (!heading || !description || !actions) return

    heading.textContent = 'We’ll be back shortly.'
    description.textContent = 'Our published website content is temporarily unavailable. You can still reach the Brew EdgeTech team directly.'

    const email = document.createElement('a')
    email.className = 'btn'
    email.href = 'mailto:hello@brewedgetech.com'
    email.textContent = 'Email Brew EdgeTech ↗'
    actions.replaceChildren(email)

    const retry = document.createElement('button')
    retry.className = 'btn alt'
    retry.type = 'button'
    retry.textContent = 'Try again'
    retry.addEventListener('click', () => {
      retry.disabled = true
      retry.textContent = 'Checking…'
      window.getPublishedSiteContent()
        .then(() => window.location.reload())
        .catch(() => {
          retry.disabled = false
          retry.textContent = 'Try again'
          description.textContent = 'Our published website content is still unavailable. Please try again shortly or email hello@brewedgetech.com.'
        })
    })
    actions.appendChild(retry)

    const style = document.createElement('style')
    style.textContent = `
      body.siteContentUnavailable #main-content>section:not(#home),
      body.siteContentUnavailable .ticker,
      body.siteContentUnavailable .valueBand,
      body.siteContentUnavailable footer,
      body.siteContentUnavailable .mobileCta,
      body.siteContentUnavailable .chatLauncher,
      body.siteContentUnavailable .top,
      body.siteContentUnavailable .heroVisual,
      body.siteContentUnavailable .heroScrollCue,
      body.siteContentUnavailable .hero .proof,
      body.siteContentUnavailable .navCta,
      body.siteContentUnavailable #menu,
      body.siteContentUnavailable #links,
      body.siteContentUnavailable #themeToggle{display:none!important}
      body.siteContentUnavailable #home{min-height:calc(100svh - 96px);padding-block:clamp(72px,14vh,150px)}
      body.siteContentUnavailable #home .heroGrid{display:block}
      body.siteContentUnavailable #home .heroGrid>div:first-child{max-width:680px}
      body.siteContentUnavailable #home h1{max-width:680px}
      body.siteContentUnavailable #home .lead{max-width:600px}
      body.siteContentUnavailable #home .actions{display:flex;flex-wrap:wrap;gap:12px}
      @media(max-width:680px){body.siteContentUnavailable #home{min-height:calc(100svh - 76px);padding-block:clamp(64px,12vh,112px)}}
    `
    document.head.appendChild(style)
  }

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
          if (data.source === 'built-in-fallback' || data.database_available === false) {
            console.warn('MongoDB is unavailable; displaying built-in website content until the database connection is restored.')
          }
          return data.content
        })
        .catch((error) => {
          publishedContentRequest = undefined
          showContentUnavailableState()
          throw error
        })
    }
    return publishedContentRequest
  }
})()
