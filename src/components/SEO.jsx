import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { api as publicApi } from '../services/api'

const SEO = ({ title: propTitle, description: propDescription, keywords: propKeywords, image: propImage, type = 'website' }) => {
    const [settings, setSettings] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Check if settings were already loaded in main.jsx
                if (window.__SITE_SETTINGS__) {
                    setSettings(window.__SITE_SETTINGS__)
                    setLoading(false)
                    return
                }

                const res = await publicApi.get('/settings')
                if (res.data?.settings) {
                    setSettings(res.data.settings)
                }
            } catch (error) {
                console.error('Failed to fetch SEO settings:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchSettings()

        // Listen for updates from settings page
        const handleUpdate = (e) => {
            if (e.detail) {
                setSettings(e.detail)
            }
        }
        window.addEventListener('site-settings-updated', handleUpdate)
        return () => window.removeEventListener('site-settings-updated', handleUpdate)
    }, [])

    const { site, seo } = settings || {}

    // Priority: Prop > Dynamic Setting > Default
    const title = propTitle
        ? `${propTitle} | ${site?.title || 'Syed Muzzamil Ali'}`
        : (site?.title || 'Syed Muzzamil Ali - Full Stack Developer | React, Node.js & Cloud Expert')

    const description = propDescription || seo?.description || site?.description || 'Portfolio of Syed Muzzamil Ali - Full Stack Developer specializing in React, Node.js, MongoDB, AWS, and modern web technologies.'

    const keywords = propKeywords || seo?.keywords || 'Syed Muzzamil Ali, Muzzaml Ali, Muzzamil, full stack developer, React developer, Node.js, MongoDB, AWS, portfolio, web developer'

    const author = site?.author || 'Syed Muzzamil Ali'
    const image = propImage || seo?.ogImage || site?.logoUrl || 'https://syedmuzzamilali.me/og-image.jpg'
    const url = window.location.href

    // JSON-LD Schema for Person
    const schema = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "Syed Muzzamil Ali",
        "alternateName": ["Muzzaml Ali", "Muzzamil", "Syed Muzzamil"],
        "url": "https://syedmuzzamilali.me",
        "sameAs": [
            "https://linkedin.com/in/syed-muzzamil-ali",
            "https://github.com/Dev-Muzzamil"
        ],
        "jobTitle": "Full Stack Developer",
        "worksFor": {
            "@type": "Organization",
            "name": "Freelance"
        },
        "description": description,
        "knowsAbout": ["JavaScript", "React", "Node.js", "MongoDB", "AWS", "TypeScript", "Full Stack Development"],
        "image": image
    }

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <meta name="author" content={author} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            {image && <meta property="og:image" content={image} />}
            <meta property="og:site_name" content={site?.title || 'Syed Muzzamil Ali Portfolio'} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={url} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            {image && <meta name="twitter:image" content={image} />}

            {/* Favicon (dynamic) */}
            {site?.faviconUrl && (
                <link rel="icon" type="image/png" href={site.faviconUrl} />
            )}

            {/* JSON-LD Schema */}
            <script type="application/ld+json">
                {JSON.stringify(schema)}
            </script>
        </Helmet>
    )
}

export default SEO
