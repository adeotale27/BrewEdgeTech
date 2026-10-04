(() => {
  const status = document.getElementById('adminLoginStatus')
  if (!status) return

  const style = document.createElement('style')
  style.textContent = `
    .admin-login-toast {
      position: fixed;
      z-index: 10000;
      top: 20px;
      right: 20px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      width: min(420px, calc(100vw - 32px));
      padding: 15px 16px;
      border: 1px solid #fecaca;
      border-radius: 12px;
      background: #fff;
      box-shadow: 0 12px 36px #1725542b;
      color: #991b1b;
      font: 500 13px/1.5 Inter, system-ui, sans-serif;
    }
    .admin-login-toast[hidden] { display: none; }
    .admin-login-toast button {
      flex: 0 0 auto;
      border: 0;
      background: transparent;
      color: inherit;
      cursor: pointer;
      font: inherit;
      font-size: 19px;
      line-height: 1;
    }
    @media (max-width: 520px) {
      .admin-login-toast { top: 12px; right: 12px; }
    }
  `
  document.head.appendChild(style)

  const toast = document.createElement('div')
  toast.className = 'admin-login-toast'
  toast.setAttribute('role', 'alert')
  toast.setAttribute('aria-live', 'assertive')
  toast.hidden = true

  const message = document.createElement('span')
  const dismiss = document.createElement('button')
  dismiss.type = 'button'
  dismiss.setAttribute('aria-label', 'Dismiss notification')
  dismiss.textContent = '×'
  dismiss.addEventListener('click', () => {
    toast.hidden = true
  })
  toast.append(message, dismiss)
  document.body.appendChild(toast)

  let timer
  let lastMessage = ''

  function showError(text) {
    if (text === lastMessage && !toast.hidden) return
    lastMessage = text
    message.textContent = text
    toast.hidden = false
    clearTimeout(timer)
    timer = setTimeout(() => {
      toast.hidden = true
    }, 9000)
  }

  window.showAdminLoginToast = showError

  const inspectStatus = () => {
    const text = status.textContent.trim()
    if (!status.classList.contains('error') || !text) {
      lastMessage = ''
      clearTimeout(timer)
      toast.hidden = true
      return
    }
    showError(text)
  }

  const observer = new MutationObserver(inspectStatus)
  observer.observe(status, {
    attributes: true,
    attributeFilter: ['class'],
    childList: true,
    characterData: true,
    subtree: true,
  })
  inspectStatus()
})()
