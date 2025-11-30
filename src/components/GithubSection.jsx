import React from 'react'
import { motion } from 'framer-motion'
import { Github, ExternalLink } from 'lucide-react'

const GithubSection = ({ username }) => {
    if (!username) return null

    return (
        <div className="w-full max-w-[1400px] mx-auto px-6 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-ink text-paper rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8"
            >
                <div className="space-y-4 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 text-accent">
                        <Github className="w-8 h-8" />
                        <span className="font-sans font-bold tracking-widest uppercase text-sm">Open Source</span>
                    </div>
                    <h3 className="font-serif text-3xl md:text-4xl text-paper">
                        Check out my code on GitHub
                    </h3>
                    <p className="font-sans text-paper/60 max-w-xl">
                        Explore my repositories, contributions, and latest coding experiments.
                    </p>
                </div>

                <motion.a
                    href={`https://github.com/${username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-8 py-4 bg-paper text-ink rounded-full font-sans text-sm font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-colors duration-300 shadow-lg"
                >
                    View Profile
                    <ExternalLink className="w-4 h-4" />
                </motion.a>
            </motion.div>
        </div>
    )
}

export default GithubSection
