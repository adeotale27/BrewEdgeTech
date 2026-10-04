(() => {
  const button = document.getElementById('saveSettings')
  const status = document.getElementById('settingsStatus')
  const fields = {
    company: 'sname',
    email: 'semail',
    phone: 'sphone',
    location: 'slocation',
    instagram: 'sinstagram',
    linkedin: 'slinkedin',
    banner: 'sbanner',
    banner_url: 'sbannerurl',
  }
  if (!button || !status) return
  document.getElementById('sname').required = true
  document.getElementById('semail').required = true

  const style = document.createElement('style')
  style.textContent = `
    #adminToast {
      position: fixed;
      z-index: 10000;
      top: 20px;
      right: 20px;
      width: min(420px, calc(100vw - 40px));
      padding: 15px 18px;
      border: 1px solid #387e70;
      border-radius: 12px;
      background: #102b2b;
      box-shadow: 0 16px 48px #0008;
      color: #d9fff2;
      font: 600 14px/1.5 Inter, system-ui, sans-serif;
    }
    #adminToast.error {
      border-color: #a94d62;
      background: #351b2a;
      color: #ffe1e7;
    }
    #adminToast[hidden] { display: none; }
    @media (max-width: 600px) {
      #adminToast { top: 12px; right: 12px; width: calc(100vw - 24px); }
    }
  `
  document.head.appendChild(style)

  const toast = document.createElement('div')
  toast.id = 'adminToast'
  toast.setAttribute('role', 'alert')
  toast.setAttribute('aria-live', 'assertive')
  toast.hidden = true
  document.body.appendChild(toast)

  let toastTimer
  function notify(message, isError = false) {
    window.clearTimeout(toastTimer)
    toast.textContent = message
    toast.classList.toggle('error', isError)
    toast.hidden = false
    toastTimer = window.setTimeout(() => { toast.hidden = true }, 6000)
    status.textContent = message
    status.className = isError ? 'status error' : 'status'
  }
  window.showAdminNotification = notify

  async function request(path, options) {
    const response = await fetch('/api' + path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
      redirect: 'manual',
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const message = typeof data.error === 'string'
        ? data.error
        : data.error?.message || data.message || `Request failed (${response.status})`
      throw new Error(message)
    }
    return data
  }

  button.onclick = async () => {
    const inputs = Object.values(fields).map((id) => document.getElementById(id))
    const invalid = inputs.find((input) => input && !input.checkValidity())
    if (invalid) {
      invalid.reportValidity()
      notify(`Please correct the ${invalid.labels?.[0]?.textContent || 'invalid'} field.`, true)
      return
    }

    const insecureField = ['sinstagram', 'slinkedin', 'sbannerurl']
      .map((id) => document.getElementById(id))
      .find((input) => input.value.trim() && !/^https:\/\//i.test(input.value.trim()))
    if (insecureField) {
      notify(`Use an HTTPS URL for ${insecureField.labels?.[0]?.textContent || 'this link'}.`, true)
      return
    }

    const originalText = button.textContent
    button.disabled = true
    button.textContent = 'Saving…'
    status.textContent = ''
    status.className = 'status'

    let draftSaved = false
    try {
      const { items = [] } = await request('/admin/content', { method: 'GET' })
      const saved = items.find((item) => item.content_key === 'footer')
      const content = { ...(saved?.content || {}) }
      for (const [key, id] of Object.entries(fields)) {
        content[key] = document.getElementById(id).value.trim()
      }

      await request('/admin/content', {
        method: 'PUT',
        body: JSON.stringify({ key: 'footer', content }),
      })
      draftSaved = true
      await request('/admin/content', {
        method: 'POST',
        body: JSON.stringify({ key: 'footer' }),
      })

      const { items: verifiedItems = [] } = await request('/admin/content', { method: 'GET' })
      const verified = verifiedItems.find((item) => item.content_key === 'footer')
      const published = verified?.published_content || {}
      const mismatch = Object.entries(fields).some(([key, id]) =>
        published[key] !== document.getElementById(id).value.trim()
      )
      if (mismatch) throw new Error('The saved values could not be verified. Please reload and try again.')

      notify('Settings saved and published successfully.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error while saving settings.'
      notify(draftSaved
        ? `Settings were saved as a draft, but publishing failed: ${message}`
        : `Settings could not be saved: ${message}`, true)
    } finally {
      button.disabled = false
      button.textContent = originalText
    }
  }
})()
