import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ExternalLink, Github, Eye, ChevronDown, Code, Award, FileText, Edit, Trash2, EyeOff, ArrowUpRight } from 'lucide-react';
import { getApiBaseUrl } from '../utils/helpers';
import TechnologyIcon from './TechnologyIcon';

const UnifiedCard = ({
    data,
    type,
    mode,
    onEdit,
    onDelete,
    onToggleVisibility,
    onExpand,
    linkedItems = [],
    className = '',
    config = {},
    activeSkillNames = null,
    targetHeight = null
}) => {
    const [websitePreviews, setWebsitePreviews] = useState({});

    // 3D Tilt Effect State
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-100, 100], [5, -5]);
    const rotateY = useTransform(x, [-100, 100], [-5, 5]);

    const defaultConfig = {
        project: {
            home: {
                showActions: false,
                showExpandButton: true,
                showTechnologies: true,
                showLinkedItems: true,
                showExternalLinks: true,
                imageHeight: 'h-64',
                embedMode: (import.meta?.env?.VITE_PROJECT_PREVIEW_MODE || 'screenshot')
            },
            admin: {
                showActions: true,
                showExpandButton: false,
                showTechnologies: true,
                showLinkedItems: true,
                showExternalLinks: false,
                imageHeight: 'h-48'
            }
        },
        certificate: {
            home: {
                showActions: false,
                showExpandButton: true,
                showTechnologies: true,
                showLinkedItems: true,
                showExternalLinks: true,
                imageHeight: 'aspect-[1.414/1]'
            },
            admin: {
                showActions: true,
                showExpandButton: false,
                showTechnologies: true,
                showLinkedItems: true,
                showExternalLinks: false,
                imageHeight: 'aspect-[1.414/1]'
            }
        },
        github: {
            home: {
                showActions: false,
                showExpandButton: true,
                showTechnologies: true,
                showLinkedItems: false,
                showExternalLinks: true,
                imageHeight: 'h-48'
            }
        }
    };

    const currentConfig = { ...defaultConfig[type][mode], ...config };

    const getImageSource = () => {
        if (type === 'project') {
            if (data.screenshots && data.screenshots.length > 0) {
                return { type: 'custom', url: data.screenshots[0], alt: data.title };
            }
            if (data.liveUrl) {
                const apiBase = getApiBaseUrl();
                const screenshotUrl = `${apiBase}/api/v1/public/screenshot?url=${encodeURIComponent(data.liveUrl)}&projectId=${data._id}`;
                return { type: 'screenshot', url: screenshotUrl, alt: data.title };
            }
            return { type: 'fallback', url: null, alt: 'No preview' };
        } else if (type === 'certificate') {
            if (data.certificateFile?.previewUrl || data.certificateFile?.originalUrl) {
                return { type: 'image', url: data.certificateFile.previewUrl || data.certificateFile.originalUrl, alt: data.title };
            }
            if (data.certificateUrl) return { type: 'image', url: data.certificateUrl, alt: data.title };
            return { type: 'fallback', url: null, alt: 'No preview' };
        } else if (type === 'github') {
            return { type: 'avatar', url: data.owner?.avatar_url || data.avatar_url, alt: data.name };
        }
        return { type: 'fallback', url: null, alt: 'No preview' };
    };

    const imageSource = getImageSource();

    const getTechnologies = () => {
        if (type === 'project') {
            // Use featuredTechnologies if available, otherwise fall back to technologies
            const featured = data.featuredTechnologies || [];
            const raw = featured.length > 0 ? featured : (data.technologies || []);
            if (!activeSkillNames) return raw;
            return raw.filter(name => activeSkillNames.has(name));
        }
        // For certificates, use featuredSkills if available
        const featuredSkills = data.featuredSkills || [];
        if (featuredSkills.length > 0) return featuredSkills;
        return data.skills || (data.language ? [data.language] : []);
    };

    const technologies = getTechnologies();

    const handleCardClick = () => {
        if (currentConfig.showExpandButton) {
            onExpand?.(data._id || data.id);
        }
    };

    const handleActionClick = (e, action) => {
        e.stopPropagation();
        action(data._id || data.id);
    };

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct * 200);
        y.set(yPct * 200);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={`project-card group cursor-pointer perspective-1000 ${className}`}
            onClick={handleCardClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                height: targetHeight || 'auto',
                perspective: 1000
            }}
        >
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d"
                }}
                className={`bg-white/60 dark:bg-surface-dark backdrop-blur-xl dark:backdrop-blur-none rounded-2xl sm:rounded-3xl border border-white/70 dark:border-white/[0.06] hover:border-accent/40 dark:hover:border-accent-dark/20 transition-all duration-500 overflow-hidden flex flex-col shadow-lg shadow-black/5 dark:shadow-black/30 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/50 h-full relative`}
            >
                {/* Image Section */}
                <div className={`relative overflow-hidden border-b border-ink/5 dark:border-ink-dark/5 ${currentConfig.imageHeight} flex-shrink-0 bg-gray/5 dark:bg-white/5 transform-style-3d`}>
                    {imageSource.url ? (
                        <img
                            src={imageSource.url}
                            alt={imageSource.alt}
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-out transform group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <span className="text-4xl opacity-20 grayscale">
                                {type === 'project' ? '💻' : '🏆'}
                            </span>
                        </div>
                    )}

                    {/* Status Badge */}
                    {data.status && (
                        <div className="absolute top-4 left-4 translate-z-10">
                            <span className="px-3 py-1 bg-paper/90 dark:bg-paper-dark/90 backdrop-blur-md text-ink dark:text-ink-dark text-[10px] font-bold uppercase tracking-widest rounded-full border border-ink/10 dark:border-ink-dark/10 shadow-sm">
                                {data.status}
                            </span>
                        </div>
                    )}

                    {/* Admin Actions Overlay */}
                    {currentConfig.showActions && (
                        <div className="absolute inset-0 bg-ink/20 dark:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm translate-z-20">
                            <div className="flex gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                <button onClick={(e) => handleActionClick(e, onEdit)} className="p-3 bg-paper dark:bg-surface-dark text-ink dark:text-ink-dark rounded-full hover:text-accent dark:hover:text-accent-dark shadow-lg">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={(e) => handleActionClick(e, onDelete)} className="p-3 bg-paper dark:bg-surface-dark text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 shadow-lg">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="p-4 sm:p-6 lg:p-8 flex-1 flex flex-col transform-style-3d">
                    <div className="mb-2 sm:mb-4 translate-z-10">
                        <h3 className="font-serif text-lg sm:text-xl lg:text-2xl text-ink dark:text-ink-dark group-hover:text-accent dark:group-hover:text-accent-dark transition-colors duration-300 leading-tight mb-1 sm:mb-2">
                            {data.title || data.name}
                        </h3>
                        {data.category && (
                            <span className="text-[10px] sm:text-xs font-sans font-bold text-gray dark:text-gray-dark uppercase tracking-widest">
                                {data.category}
                            </span>
                        )}
                    </div>

                    <p className="font-sans text-xs sm:text-sm text-ink/60 dark:text-ink-dark/60 leading-relaxed mb-4 sm:mb-6 flex-1 translate-z-5">
                        {data.description}
                    </p>

                    {/* Footer */}
                    <div className="mt-auto pt-4 sm:pt-6 border-t border-ink/5 dark:border-ink-dark/5 flex flex-col gap-3 translate-z-5">
                        {/* Technologies */}
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 max-w-full">
                            {technologies.map((tech, i) => (
                                <span key={i} className="px-2 sm:px-3 py-0.5 sm:py-1 border border-ink/20 dark:border-ink-dark/20 rounded-full text-[9px] sm:text-[10px] font-sans font-bold text-ink dark:text-ink-dark uppercase tracking-widest hover:bg-ink dark:hover:bg-ink-dark hover:text-paper dark:hover:text-paper-dark transition-colors duration-300 cursor-default truncate max-w-[100px] sm:max-w-none">
                                    {typeof tech === 'string' ? tech : tech.name}
                                </span>
                            ))}
                        </div>

                        {/* Links Footer (Home Mode) - Icons only, right aligned. Always show for consistent height */}
                        {!currentConfig.showActions && (
                            <div className="flex justify-end gap-1 pt-2 border-t border-ink/5 dark:border-ink-dark/5 min-h-[32px] sm:min-h-[40px]">
                                {/* Live URLs */}
                                {(data.liveUrls?.length > 0 ? data.liveUrls : (data.liveUrl ? [data.liveUrl] : [])).map((url, idx) => (
                                    <a
                                        key={`live-${idx}`}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-1.5 sm:p-2 text-ink/40 dark:text-ink-dark/40 hover:text-accent dark:hover:text-accent-dark transition-colors rounded-full hover:bg-accent/10 dark:hover:bg-accent-dark/10"
                                        title={`Live Demo${(data.liveUrls?.length > 1) ? ` ${idx + 1}` : ''}`}
                                    >
                                        <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </a>
                                ))}
                                {/* GitHub URLs */}
                                {(data.githubUrls?.length > 0 ? data.githubUrls : (data.githubUrl ? [data.githubUrl] : [])).map((url, idx) => (
                                    <a
                                        key={`github-${idx}`}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-1.5 sm:p-2 text-ink/40 dark:text-ink-dark/40 hover:text-accent dark:hover:text-accent-dark transition-colors rounded-full hover:bg-accent/10 dark:hover:bg-accent-dark/10"
                                        title={`GitHub${(data.githubUrls?.length > 1) ? ` Repo ${idx + 1}` : ''}`}
                                    >
                                        <Github className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default UnifiedCard;