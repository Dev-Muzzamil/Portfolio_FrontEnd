import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Eye, Github, Linkedin, Globe } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { smoothScrollTo } from '../../utils/smoothScroll';
import { extractUsernameFromUrl } from '../../utils/socialMediaHelpers';

const Hero = () => {
  const { about, configuration, loading } = useData();

  const scrollToAbout = () => {
    smoothScrollTo('about', 80); // 80px offset for navbar
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 flex items-center justify-center relative overflow-hidden">

      <div className="container-max section-padding relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight"
              >
                Hello, I'm{' '}
                <span className="text-primary-600">
                  {about?.name || configuration?.siteInfo?.name || 'Your Name'}
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl md:text-2xl text-gray-600 font-medium text-justify"
              >
                {about?.title || configuration?.siteInfo?.title || 'Your Professional Title'}
              </motion.p>
              
              {/* Multiple Paragraphs Support */}
              {(() => {
                const shortBio = about?.shortBio || 
                                configuration?.siteInfo?.bioParagraphs || 
                                ['A brief description about yourself and your expertise.'];
                
                // Ensure shortBio is always an array
                const shortBioArray = Array.isArray(shortBio) ? shortBio : [shortBio];
                
                return (
                <motion.div 
                  className="max-w-2xl space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                    {shortBioArray.map((paragraph, index) => (
                    <motion.p
                      key={index}
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        duration: 0.6, 
                        delay: 0.6 + (index * 0.15),
                        ease: [0.25, 0.46, 0.45, 0.94]
                      }}
                      whileHover={{ 
                        scale: 1.02,
                        transition: { duration: 0.2 }
                      }}
                        className="text-lg text-gray-600 leading-relaxed text-justify"
                    >
                      {paragraph}
                    </motion.p>
                  ))}
                </motion.div>
                );
              })()}
            </div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: 0.8,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button
                onClick={scrollToAbout}
                className="btn-primary flex items-center justify-center space-x-2 px-8 py-3 text-lg"
              >
                <span>Get to know me</span>
                <ChevronDown className="w-5 h-5" />
              </button>
              
              {about?.resumes && about.resumes.find(r => r.isActive) && (
                <a
                  href={about.resumes.find(r => r.isActive).url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline flex items-center justify-center space-x-2 px-8 py-3 text-lg"
                >
                  <Eye className="w-5 h-5" />
                  <span>View CV</span>
                </a>
              )}
            </motion.div>

            {/* Social Media Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="space-y-3"
            >
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Connect with me
              </h3>
              <div className="flex flex-wrap gap-4">
                {/* GitHub */}
                {(() => {
                  const githubUrl = about?.socialLinks?.github || configuration?.socialLinks?.github;
                  const githubUsername = githubUrl ? extractUsernameFromUrl(githubUrl, 'github') : 'github';
                  return githubUrl && (
                    <motion.a
                      href={githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 group"
                    >
                      <Github className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        @{githubUsername}
                      </span>
                    </motion.a>
                  );
                })()}
                
                {/* LinkedIn */}
                {(() => {
                  const linkedinUrl = about?.socialLinks?.linkedin || configuration?.socialLinks?.linkedin;
                  const linkedinUsername = linkedinUrl ? extractUsernameFromUrl(linkedinUrl, 'linkedin') : 'linkedin';
                  return linkedinUrl && (
                    <motion.a
                      href={linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 group"
                    >
                      <Linkedin className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        @{linkedinUsername}
                      </span>
                    </motion.a>
                  );
                })()}
                
                {/* X */}
                {(() => {
                  const xUrl = about?.socialLinks?.x || configuration?.socialLinks?.x;
                  const xUsername = xUrl ? extractUsernameFromUrl(xUrl, 'x') : 'x';
                  return xUrl && (
                    <motion.a
                      href={xUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 group"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      <span className="text-sm font-medium">
                        @{xUsername}
                      </span>
                    </motion.a>
                  );
                })()}
                
                {/* Instagram */}
                {(about?.socialLinks?.instagram?.url || configuration?.socialLinks?.instagram) && (
                  <motion.a
                    href={about?.socialLinks?.instagram?.url || configuration?.socialLinks?.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 group"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.322-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.419-3.322c.874-.807 2.025-1.297 3.322-1.297s2.448.49 3.322 1.297c.929.874 1.419 2.025 1.419 3.322s-.49 2.448-1.419 3.322c-.874.807-2.025 1.297-3.322 1.297zm7.718-1.297c-.874.807-2.025 1.297-3.322 1.297s-2.448-.49-3.322-1.297c-.929-.874-1.419-2.025-1.419-3.322s.49-2.448 1.419-3.322c.874-.807 2.025-1.297 3.322-1.297s2.448.49 3.322 1.297c.929.874 1.419 2.025 1.419 3.322s-.49 2.448-1.419 3.322z"/>
                    </svg>
                    <span className="text-sm font-medium">
                      @{(about?.socialLinks?.instagram ? extractUsernameFromUrl(about.socialLinks.instagram, 'instagram') : 'instagram')}
                    </span>
                  </motion.a>
                )}
                
                {/* Website */}
                {(() => {
                  const websiteUrl = about?.socialLinks?.website || configuration?.socialLinks?.website;
                  const websiteUsername = websiteUrl ? extractUsernameFromUrl(websiteUrl, 'website') : 'website';
                  return websiteUrl && (
                    <motion.a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 group"
                    >
                      <Globe className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        @{websiteUsername}
                      </span>
                    </motion.a>
                  );
                })()}
                
                {/* Facebook */}
                {(() => {
                  const facebookUrl = about?.socialLinks?.facebook || configuration?.socialLinks?.facebook;
                  const facebookUsername = facebookUrl ? extractUsernameFromUrl(facebookUrl, 'facebook') : 'facebook';
                  return facebookUrl && (
                    <motion.a
                      href={facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors duration-200 group"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span className="text-sm font-medium">
                        @{facebookUsername}
                      </span>
                    </motion.a>
                  );
                })()}
                
                {/* YouTube */}
                {(() => {
                  const youtubeUrl = about?.socialLinks?.youtube || configuration?.socialLinks?.youtube;
                  const youtubeUsername = youtubeUrl ? extractUsernameFromUrl(youtubeUrl, 'youtube') : 'youtube';
                  return youtubeUrl && (
                    <motion.a
                      href={youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 group"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      <span className="text-sm font-medium">
                        @{youtubeUsername}
                      </span>
                    </motion.a>
                  );
                })()}
                
                {/* TikTok */}
                {(() => {
                  const tiktokUrl = about?.socialLinks?.tiktok || configuration?.socialLinks?.tiktok;
                  const tiktokUsername = tiktokUrl ? extractUsernameFromUrl(tiktokUrl, 'tiktok') : 'tiktok';
                  return tiktokUrl && (
                    <motion.a
                      href={tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 group"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                      </svg>
                      <span className="text-sm font-medium">
                        @{tiktokUsername}
                      </span>
                    </motion.a>
                  );
                })()}
                
                {/* Discord */}
                {(() => {
                  const discordUrl = about?.socialLinks?.discord || configuration?.socialLinks?.discord;
                  const discordUsername = discordUrl ? extractUsernameFromUrl(discordUrl, 'discord') : 'discord';
                  return discordUrl && (
                    <motion.a
                      href={discordUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 group"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
                      </svg>
                      <span className="text-sm font-medium">
                        {discordUsername}
                      </span>
                    </motion.a>
                  );
                })()}
                
                {/* Telegram */}
                {(() => {
                  const telegramUrl = about?.socialLinks?.telegram || configuration?.socialLinks?.telegram;
                  const telegramUsername = telegramUrl ? extractUsernameFromUrl(telegramUrl, 'telegram') : 'telegram';
                  return telegramUrl && (
                    <motion.a
                      href={telegramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 group"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                      <span className="text-sm font-medium">
                        @{telegramUsername}
                      </span>
                    </motion.a>
                  );
                })()}
                
                {/* WhatsApp */}
                {(() => {
                  const whatsappUrl = about?.socialLinks?.whatsapp || configuration?.socialLinks?.whatsapp;
                  const whatsappUsername = whatsappUrl ? extractUsernameFromUrl(whatsappUrl, 'whatsapp') : 'whatsapp';
                  return whatsappUrl && (
                    <motion.a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 group"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                      <span className="text-sm font-medium">
                        {whatsappUsername}
                      </span>
                    </motion.a>
                  );
                })()}
                
                {/* Reddit */}
                {(() => {
                  const redditUrl = about?.socialLinks?.reddit || configuration?.socialLinks?.reddit;
                  const redditUsername = redditUrl ? extractUsernameFromUrl(redditUrl, 'reddit') : 'reddit';
                  return redditUrl && (
                    <motion.a
                      href={redditUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 group"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                      </svg>
                      <span className="text-sm font-medium">
                        u/{redditUsername}
                      </span>
                    </motion.a>
                  );
                })()}
                
                {/* Behance */}
                {(() => {
                  const behanceUrl = about?.socialLinks?.behance || configuration?.socialLinks?.behance;
                  const behanceUsername = behanceUrl ? extractUsernameFromUrl(behanceUrl, 'behance') : 'behance';
                  return behanceUrl && (
                    <motion.a
                      href={behanceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors duration-200 group"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22 7h-7v-2h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.484.11 1.258.11 2.198h-8.477c.194 1.699.74 2.822 2.74 2.822 1.227 0 1.934-.726 2.104-1.702h2.97zm-8.426-5.413h5.253c-.194-1.202-1.03-1.747-2.482-1.747-1.437 0-2.312.91-2.771 1.747zm-9.574 6.413h-6.726v-14.052h6.726v14.052zm-2.104-16.108c-2.237 0-3.608 1.493-3.608 3.61 0 2.18 1.371 3.576 3.608 3.576 2.236 0 3.609-1.396 3.609-3.576 0-2.117-1.372-3.61-3.609-3.61zm16.353 16.108v-5.718h2.016v5.718h-2.016z"/>
                      </svg>
                      <span className="text-sm font-medium">
                        @{behanceUsername}
                      </span>
                    </motion.a>
                  );
                })()}
                
                {/* Dribbble */}
                {(() => {
                  const dribbbleUrl = about?.socialLinks?.dribbble || configuration?.socialLinks?.dribbble;
                  const dribbbleUsername = dribbbleUrl ? extractUsernameFromUrl(dribbbleUrl, 'dribbble') : 'dribbble';
                  return dribbbleUrl && (
                    <motion.a
                      href={dribbbleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors duration-200 group"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.816zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.433 0-.856.04-1.27.112zm4.885 15.66c.435-.15.894-.3 1.363-.46a7.957 7.957 0 01-1.149 2.817c2.008-1.123 3.61-2.914 4.316-5.002a9.642 9.642 0 01-4.53 2.645z"/>
                      </svg>
                      <span className="text-sm font-medium">
                        @{dribbbleUsername}
                      </span>
                    </motion.a>
                  );
                })()}
                
                {/* Pinterest */}
                {(() => {
                  const pinterestUrl = about?.socialLinks?.pinterest || configuration?.socialLinks?.pinterest;
                  const pinterestUsername = pinterestUrl ? extractUsernameFromUrl(pinterestUrl, 'pinterest') : 'pinterest';
                  return pinterestUrl && (
                    <motion.a
                      href={pinterestUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors duration-200 group"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                      </svg>
                      <span className="text-sm font-medium">
                        @{pinterestUsername}
                      </span>
                    </motion.a>
                  );
                })()}
                
                {/* Medium */}
                {(() => {
                  const mediumUrl = about?.socialLinks?.medium || configuration?.socialLinks?.medium;
                  const mediumUsername = mediumUrl ? extractUsernameFromUrl(mediumUrl, 'medium') : 'medium';
                  return mediumUrl && (
                    <motion.a
                      href={mediumUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors duration-200 group"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75S24 8.83 24 12"/>
                      </svg>
                      <span className="text-sm font-medium">
                        @{mediumUsername}
                      </span>
                    </motion.a>
                  );
                })()}
                
                {/* Dev.to */}
                {(() => {
                  const devUrl = about?.socialLinks?.dev || configuration?.socialLinks?.dev;
                  const devUsername = devUrl ? extractUsernameFromUrl(devUrl, 'dev') : 'dev';
                  return devUrl && (
                    <motion.a
                      href={devUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors duration-200 group"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7.42 10.05c-.18-.16-.46-.23-.84-.23H6l.02 2.44.04 2.45.56-.02c.41 0 .63-.07.83-.26.24-.24.3-.36.3-.83v-2.29l-.01-2.48-.03-.38zm4.71-4.33c-.17-.43-.64-.79-1.08-.79s-.91.36-1.08.79l-8.91 21.11c-.18.43.64 1.18 1.08 1.18.44 0 .9-.75 1.08-1.18l8.91-21.11zM22.14 10.05c-.18-.16-.46-.23-.84-.23h-.58l.02 2.44.04 2.45.56-.02c.41 0 .63-.07.83-.26.24-.24.3-.36.3-.83v-2.29l-.01-2.48-.03-.38z"/>
                      </svg>
                      <span className="text-sm font-medium">
                        @{devUsername}
                      </span>
                    </motion.a>
                  );
                })()}
                
                {/* Stack Overflow */}
                {(() => {
                  const stackoverflowUrl = about?.socialLinks?.stackoverflow || configuration?.socialLinks?.stackoverflow;
                  const stackoverflowUsername = stackoverflowUrl ? extractUsernameFromUrl(stackoverflowUrl, 'stackoverflow') : 'stackoverflow';
                  return stackoverflowUrl && (
                    <motion.a
                      href={stackoverflowUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 group"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M15.725 0l-1.72 1.277 6.39 8.588 1.716-1.277L15.725 0zm-3.94 3.418L8.65 7.765l5.482 3.32 3.135-4.347-5.482-3.32zm-5.38 5.137l-2.35 3.293 4.592 3.255 2.35-3.293-4.592-3.255zm-2.92 4.722l-.894 1.495 3.794.89.894-1.495-3.794-.89zm-1.504 3.324l-.184 1.478 3.472.431.184-1.478-3.472-.431zm5.518-15.295L12 4.86l1.595-2.373L12 .192l-1.595 2.295zm3.593 8.73l-1.595 2.373 3.19 2.14 1.595-2.373-3.19-2.14zm4.982 3.344l-1.595 2.373 3.19 2.14 1.595-2.373-3.19-2.14zm1.595-2.373l1.595 2.373 3.19-2.14-1.595-2.373-3.19 2.14zm-8.577 2.373l1.595 2.373 3.19-2.14-1.595-2.373-3.19 2.14z"/>
                      </svg>
                      <span className="text-sm font-medium">
                        @{stackoverflowUsername}
                      </span>
                    </motion.a>
                  );
                })()}

                {/* Custom Social Media */}
                {about?.socialLinks?.custom?.map((customLink, index) => {
                  if (!customLink.name || !customLink.url) return null;
                  
                  return (
                    <motion.a
                      key={`custom-${index}`}
                      href={customLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 group"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      <span className="text-sm font-medium">
                        {customLink.name}
                      </span>
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>

          {/* Profile Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: [0, -10, 0]
            }}
            transition={{ 
              duration: 0.8, 
              delay: 0.4,
              y: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
            className="flex justify-center lg:justify-end lg:pr-8 lg:-mt-8"
          >
            <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6">
              <div className="w-80 h-80 bg-gray-100 rounded-lg flex items-center justify-center">
                {(configuration?.profilePhoto?.url || about?.photo?.url) ? (
                  <img
                    src={configuration?.profilePhoto?.url || about?.photo?.url}
                    alt={configuration?.profilePhoto?.alt || configuration?.siteInfo?.name || about?.name || 'Profile'}
                    className="w-72 h-72 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-72 h-72 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-6xl font-bold text-primary-600">
                      {(configuration?.siteInfo?.name || about?.name || 'Y').charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.button
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          onClick={scrollToAbout}
          className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.button>
      </motion.div>
    </section>
  );
};

export default Hero;
