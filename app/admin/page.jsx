import HtmlPage, { getTemplateMetadata } from '../HtmlPage'

export async function generateMetadata() {
  return getTemplateMetadata('admin.html')
}

export default function AdminPage() {
  return <HtmlPage template="admin.html" className="admin-page" />
}
