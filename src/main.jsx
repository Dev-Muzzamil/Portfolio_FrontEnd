import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { api as publicApi } from './services/api'
import './index.css'

const router = createBrowserRouter(
  [
    {
      path: '/*',
      element: <App />
    }
  ],
  {
    // Opt-in to upcoming v7 behaviors to remove dev warnings and opt-in early
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </HelmetProvider>
  </React.StrictMode>,
)

// Fetch site settings on startup and update document title/favicon
;(async function applySiteSettings() {
  try {
    const res = await publicApi.get('/settings')
    const settings = res?.data?.settings
    if (settings && settings.site) {
    // Expose to global so components can consume without a full context for now
    window.__SITE_SETTINGS__ = settings
    try { window.dispatchEvent(new CustomEvent('site-settings-updated', { detail: settings })) } catch (e) {}
      if (settings.site.title) document.title = `${settings.site.title}`
      if (settings.site.faviconUrl) {
        const link = document.querySelector("link[rel*='icon']") || document.createElement('link')
        link.type = 'image/png'
        link.rel = 'icon'
        link.href = settings.site.faviconUrl
        document.getElementsByTagName('head')[0].appendChild(link)
      }
      // If logo is used in navbar or header, components subscribe to API or read settings elsewhere.
    }
  } catch (err) {
    console.debug('Failed to apply site settings:', err && err.message)
  }
})()