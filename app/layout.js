import './globals.css'

export const metadata = {
  title: 'Brew EdgeTech',
  description: 'Digital products and technology services by Brew EdgeTech.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}