import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Heart, Github, Linkedin, Globe, X, Instagram, Facebook, Youtube, MessageCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import axios from '../../utils/axiosConfig';
import { useData } from '../../contexts/DataContext';
import { extractUsernameFromUrl } from '../../utils/socialMediaHelpers';

const ContactFooter = () => {
  const { about, configuration } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentYear = new Date().getFullYear();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/v1/public/contact', data);
      
      if (response.data.success) {
        toast.success(response.data.message || 'Message sent successfully!');
        reset();
      } else {
        toast.error(response.data.message || 'Failed to send message');
      }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to send message';

          if (error.response?.data?.errors) {
            // Handle validation errors
            const validationErrors = error.response.data.errors;
            validationErrors.forEach(error => {
              toast.error(`${error.field}: ${error.message}`);
            });
          } else if (error.response?.status === 503) {
            // Handle service unavailable (email not configured)
            toast.error('Contact form is temporarily unavailable. Please try the WhatsApp option or contact us directly.');
          } else {
            toast.error(errorMessage);
          }
        } finally {
          setIsSubmitting(false);
        }
  };

  // Get phone number for WhatsApp
  const getPhoneNumber = () => {
    return about?.phone || configuration?.contactInfo?.phone || about?.socialLinks?.whatsapp || configuration?.socialLinks?.whatsapp;
  };

  // Handle WhatsApp message
  const handleWhatsAppMessage = () => {
    const formData = {
      name: document.getElementById('name')?.value || '',
      email: document.getElementById('email')?.value || '',
      subject: document.getElementById('subject')?.value || '',
      message: document.getElementById('message')?.value || ''
    };
    
    const phoneNumber = getPhoneNumber();
    
    if (!phoneNumber) {
      toast.error('WhatsApp number not available');
      return;
    }
    
    // Clean phone number (remove any non-digits except +)
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    
    // Create WhatsApp message
    let whatsappMessage = `Hi! I'm ${formData.name}`;
    if (formData.email) whatsappMessage += ` (${formData.email})`;
    if (formData.subject) whatsappMessage += `\n\nSubject: ${formData.subject}`;
    whatsappMessage += `\n\n${formData.message}`;
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(whatsappMessage);
    
    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // Social media links with conditional display
  const getSocialLinks = () => {
    const links = [];
    
    // GitHub
    const githubUrl = about?.socialLinks?.github || configuration?.socialLinks?.github;
    if (githubUrl) {
      const githubUsername = extractUsernameFromUrl(githubUrl, 'github');
      links.push({
        name: 'GitHub',
        icon: Github,
        href: githubUrl,
        username: githubUsername,
        color: 'hover:text-gray-300'
      });
    }

    // LinkedIn
    const linkedinUrl = about?.socialLinks?.linkedin || configuration?.socialLinks?.linkedin;
    if (linkedinUrl) {
      const linkedinUsername = extractUsernameFromUrl(linkedinUrl, 'linkedin');
      links.push({
        name: 'LinkedIn',
        icon: Linkedin,
        href: linkedinUrl,
        username: linkedinUsername,
        color: 'hover:text-blue-400'
      });
    }

    // X (formerly Twitter)
    const xUrl = about?.socialLinks?.x || configuration?.socialLinks?.x;
    if (xUrl) {
      const xUsername = extractUsernameFromUrl(xUrl, 'x');
      links.push({
        name: 'X',
        icon: X,
        href: xUrl,
        username: xUsername,
        color: 'hover:text-gray-300'
      });
    }

    // Instagram
    const instagramUrl = about?.socialLinks?.instagram || configuration?.socialLinks?.instagram;
    if (instagramUrl) {
      const instagramUsername = extractUsernameFromUrl(instagramUrl, 'instagram');
      links.push({
        name: 'Instagram',
        icon: Instagram,
        href: instagramUrl,
        username: instagramUsername,
        color: 'hover:text-pink-400'
      });
    }

    // Facebook
    const facebookUrl = about?.socialLinks?.facebook || configuration?.socialLinks?.facebook;
    if (facebookUrl) {
      const facebookUsername = extractUsernameFromUrl(facebookUrl, 'facebook');
      links.push({
        name: 'Facebook',
        icon: Facebook,
        href: facebookUrl,
        username: facebookUsername,
        color: 'hover:text-blue-400'
      });
    }

    // YouTube
    const youtubeUrl = about?.socialLinks?.youtube || configuration?.socialLinks?.youtube;
    if (youtubeUrl) {
      const youtubeUsername = extractUsernameFromUrl(youtubeUrl, 'youtube');
      links.push({
        name: 'YouTube',
        icon: Youtube,
        href: youtubeUrl,
        username: youtubeUsername,
        color: 'hover:text-red-400'
      });
    }

    // TikTok
    const tiktokUrl = about?.socialLinks?.tiktok || configuration?.socialLinks?.tiktok;
    if (tiktokUrl) {
      const tiktokUsername = extractUsernameFromUrl(tiktokUrl, 'tiktok');
      links.push({
        name: 'TikTok',
        icon: MessageCircle,
        href: tiktokUrl,
        username: tiktokUsername,
        color: 'hover:text-white'
      });
    }

    // Discord
    const discordUrl = about?.socialLinks?.discord || configuration?.socialLinks?.discord;
    if (discordUrl) {
      links.push({
        name: 'Discord',
        icon: MessageCircle,
        href: discordUrl,
        username: 'Join Server',
        color: 'hover:text-indigo-400'
      });
    }

    // Telegram
    const telegramUrl = about?.socialLinks?.telegram || configuration?.socialLinks?.telegram;
    if (telegramUrl) {
      const telegramUsername = extractUsernameFromUrl(telegramUrl, 'telegram');
      links.push({
        name: 'Telegram',
        icon: MessageCircle,
        href: telegramUrl,
        username: telegramUsername,
        color: 'hover:text-blue-400'
      });
    }

    // Website
    const websiteUrl = about?.socialLinks?.website || configuration?.socialLinks?.website;
    if (websiteUrl) {
      links.push({
        name: 'Website',
        icon: Globe,
        href: websiteUrl,
        username: 'Visit Site',
        color: 'hover:text-green-400'
      });
    }

    // Email
    const emailAddress = about?.email || configuration?.contactInfo?.email;
    if (emailAddress) {
      links.push({
        name: 'Email',
        icon: Mail,
        href: `mailto:${emailAddress}`,
        username: 'Send Email',
        color: 'hover:text-red-400'
      });
    }

    // Custom social media
    if (about?.socialLinks?.custom) {
      about.socialLinks.custom.forEach((customLink, index) => {
        if (customLink.name && customLink.url) {
          links.push({
            name: customLink.name,
            icon: Globe, // Use Globe icon for custom platforms
            href: customLink.url,
            username: customLink.name,
            color: 'hover:text-purple-400'
          });
        }
      });
    }

    return links;
  };

  const socialLinks = getSocialLinks();

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10">
        {/* Contact Section */}
        <motion.section 
          id="contact"
          className="section-padding"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="container-max">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true, margin: "-50px" }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Get In <span className="text-primary-400">Touch</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Have a project in mind or want to collaborate? I'd love to hear from you!
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">Let's Connect</h3>
                  <p className="text-lg text-gray-300 mb-8">
                    I'm always interested in new opportunities and exciting projects. 
                    Whether you have a question or just want to say hi, feel free to reach out!
                  </p>
                </div>

                {/* Contact Details */}
                <div className="space-y-6">
                  {about?.email && (
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary-600/20 rounded-lg flex items-center justify-center">
                        <Mail className="w-6 h-6 text-primary-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Email</p>
                        <a 
                          href={`mailto:${about.email}`}
                          className="text-primary-400 hover:text-primary-300 transition-colors duration-200"
                        >
                          {about.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {about?.phone && (
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary-600/20 rounded-lg flex items-center justify-center">
                        <Phone className="w-6 h-6 text-primary-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Phone</p>
                        <a 
                          href={`tel:${about.phone}`}
                          className="text-primary-400 hover:text-primary-300 transition-colors duration-200"
                        >
                          {about.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {about?.location && (
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary-600/20 rounded-lg flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-primary-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Location</p>
                        <p className="text-gray-300">{about.location}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {socialLinks.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Follow Me</h4>
                    <div className="flex flex-wrap gap-3">
                      {socialLinks.slice(0, 6).map((link, index) => (
                        <motion.a
                          key={link.name}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center space-x-2 px-3 py-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-all duration-200 ${link.color} group`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          viewport={{ once: true }}
                        >
                          <link.icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{link.name}</span>
                        </motion.a>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50"
              >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        {...register('name', { required: 'Name is required' })}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-gray-400"
                        placeholder="Your Name"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        {...register('email', { 
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-gray-400"
                        placeholder="your.email@example.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      {...register('subject')}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="What's this about?"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      rows={6}
                      {...register('message', { required: 'Message is required' })}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
                      placeholder="Tell me about your project or just say hello..."
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-red-400">{errors.message.message}</p>
                    )}
                  </div>

                  {/* Split Button for Email and WhatsApp */}
                  <div className="flex space-x-3">
                    {/* Email Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="loading-spinner"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>Send Email</span>
                        </>
                      )}
                    </button>

                    {/* WhatsApp Button */}
                    <button
                      type="button"
                      onClick={handleWhatsAppMessage}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 text-lg"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Footer Bottom */}
        <motion.div 
          className="border-t border-gray-700/50 py-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="container-max">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-2 text-gray-400">
                <span>© {currentYear}</span>
                <span className="font-semibold text-white">
                  {configuration?.siteInfo?.name || about?.name || 'Your Name'}
                </span>
                <span>• Made with</span>
                <Heart className="w-4 h-4 text-red-500 fill-current" />
                <span>for the web</span>
              </div>
              
              <div className="flex items-center space-x-6">
                {socialLinks.map((link, index) => (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-gray-400 ${link.color} transition-colors duration-200`}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <link.icon className="w-5 h-5" />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default ContactFooter;
