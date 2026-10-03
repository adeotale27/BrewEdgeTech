import { redirect } from 'next/navigation'

// The public marketing site is served as a preserved static document at /site.html
// via a beforeFiles rewrite in next.config.js. This is only a safety fallback.
export default function Page() {
  redirect('/site.html')
}
