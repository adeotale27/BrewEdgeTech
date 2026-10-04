(() => {
  const button = document.getElementById('importBuiltInData')
  const status = document.getElementById('importBuiltInDataStatus')
  if (!button || !status) return

  function notify(message, isError = false) {
    status.textContent = message
    status.className = isError ? 'status error' : 'status'
    if (typeof window.showAdminNotification === 'function') {
      window.showAdminNotification(message, isError)
    }
  }

  button.addEventListener('click', async () => {
    if (!window.confirm('Import the built-in service, pricing, FAQ, demo, homepage, mobile preview, SEO, footer and version data? Existing MongoDB records will not be changed.')) return

    const originalText = button.textContent
    button.disabled = true
    button.textContent = 'Importing…'
    status.textContent = ''
    status.className = 'status'

    try {
      const response = await fetch('/api/admin/import-built-in-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'manual',
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message = typeof data.error === 'string'
          ? data.error
          : data.error?.message || data.message || `Import failed (${response.status})`
        throw new Error(message)
      }

      const inserted = data.counts?.inserted || {}
      const preserved = data.counts?.preserved || {}
      const added = Object.values(inserted).reduce((total, count) => total + Number(count || 0), 0)
      const kept = Object.values(preserved).reduce((total, count) => total + Number(count || 0), 0)
      notify(`Import complete: ${added} records added; ${kept} existing records preserved.`)
    } catch (error) {
      notify(`Built-in data import failed: ${error.message}`, true)
    } finally {
      button.disabled = false
      button.textContent = originalText
    }
  })
})()
