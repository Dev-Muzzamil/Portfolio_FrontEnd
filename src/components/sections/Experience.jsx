import React from 'react';
import { motion } from 'framer-motion';

const Experience = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="h-full relative">
            {/* Warm Gradient Background */}
            <div className="absolute inset-0 -z-10 rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#E6C2A3]/10 to-transparent dark:from-[#3D3530]/20" />
            </div>
            <div className="text-center mb-8 sm:mb-10 lg:mb-12">
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-ink dark:text-ink-dark mb-2 sm:mb-3 lg:mb-4">
                    Professional <span className="text-accent dark:text-accent-dark">Journey.</span>
                </h2>
                <p className="font-sans text-ink/60 dark:text-ink-dark/60 text-xs sm:text-sm md:text-base lg:text-lg max-w-2xl mx-auto px-2">
                    Career milestones and professional experience.
                </p>
            </div>

            <div className="relative border-l border-ink/10 dark:border-ink-dark/10 ml-2 sm:ml-3 md:ml-6 lg:ml-8 space-y-4 sm:space-y-5 lg:space-y-6">
                {data.map((exp, i) => {
                    // Date Formatting
                    const getYear = (dateStr) => {
                        if (!dateStr) return '';
                        return new Date(dateStr).getFullYear();
                    };
                    const startYear = exp.startLabel || getYear(exp.startDate);
                    const endYear = exp.isCurrent ? 'Present' : (exp.endLabel || getYear(exp.endDate));
                    const period = startYear ? `${startYear} - ${endYear}` : endYear;

                    return (
                        <motion.div
                            key={exp._id || i}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: i * 0.2 }}
                            className="relative pl-4 sm:pl-6 md:pl-8 lg:pl-10 group"
                        >
                            {/* Timeline Dot */}
                            <span className="absolute -left-[5px] top-4 sm:top-5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-accent dark:bg-accent-dark ring-2 sm:ring-4 ring-paper dark:ring-paper-dark group-hover:scale-150 transition-transform duration-300" />

                            {/* Glassmorphism Card */}
                            <div className="p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl dark:shadow-strong-dark hover:shadow-2xl dark:hover:shadow-2xl transition-all duration-300 hover:border-accent/30 dark:hover:border-accent-dark/30">

                                {/* Period */}
                                <span className="font-sans text-[9px] sm:text-[10px] font-bold text-accent dark:text-accent-dark tracking-widest uppercase mb-0.5 sm:mb-1 block">
                                    {period}
                                </span>

                                {/* Title */}
                                <h3 className="font-serif text-sm sm:text-base md:text-lg lg:text-xl text-ink dark:text-ink-dark mb-0.5 sm:mb-1 group-hover:text-accent dark:group-hover:text-accent-dark transition-colors duration-300 leading-tight">
                                    {exp.position || exp.title}
                                </h3>

                                {/* Organization */}
                                <h4 className="font-sans text-ink/60 dark:text-ink-dark/60 mb-1.5 sm:mb-2 text-[10px] sm:text-xs md:text-sm">
                                    {exp.company || exp.org}
                                    {exp.location && <span className="ml-1.5 sm:ml-2 text-ink/40 dark:text-ink-dark/40">• {exp.location}</span>}
                                </h4>

                                {/* Description */}
                                {exp.description && (
                                    <p className="font-sans text-[10px] sm:text-xs text-ink/80 dark:text-ink-dark/80 max-w-2xl leading-relaxed mb-2 sm:mb-3">
                                        {exp.description}
                                    </p>
                                )}

                                {/* Technologies/Skills Tags */}
                                {(exp.skills || exp.technologies) && (exp.skills || exp.technologies).length > 0 && (
                                    <div className="flex gap-1 sm:gap-1.5 flex-wrap">
                                        {(exp.skills || exp.technologies).map((t, idx) => (
                                            <span key={idx} className="text-[8px] sm:text-[9px] font-medium text-ink/60 dark:text-ink-dark/60 bg-white dark:bg-white/10 px-1 sm:px-1.5 py-0.5 rounded border border-ink/5 dark:border-ink-dark/5">
                                                {typeof t === 'string' ? t : t.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default Experience;
