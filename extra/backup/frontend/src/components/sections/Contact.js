import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import axios from '../../utils/axiosConfig';
import { useData } from '../../contexts/DataContext';
import FormField from '../common/FormField';
import Button from '../common/Button';
import AnimatedSection from '../common/AnimatedSection';

const Contact = () => {
  const { about, configuration } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await axios.post('/api/v1/public/contact', data);
      toast.success('Message sent successfully!');
      reset();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.section 
      id="contact" 
      className="section-padding bg-gray-50"
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
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Get In <span className="text-primary-600">Touch</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
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
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Let's Connect</h3>
              <p className="text-lg text-gray-600 mb-8">
                I'm always interested in new opportunities and exciting projects. 
                Whether you have a question or just want to say hi, feel free to reach out!
              </p>
            </div>

            {/* Contact Details */}
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Email</p>
                  <a 
                    href={`mailto:${configuration?.contactInfo?.email || about?.email || 'your.email@example.com'}`}
                    className="text-primary-600 hover:text-primary-700 transition-colors duration-200"
                  >
                    {configuration?.contactInfo?.email || about?.email || 'your.email@example.com'}
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Phone</p>
                  <a 
                    href={`tel:${configuration?.contactInfo?.phone || about?.phone || '+1234567890'}`}
                    className="text-primary-600 hover:text-primary-700 transition-colors duration-200"
                  >
                    {configuration?.contactInfo?.phone || about?.phone || '+1 234 567 8900'}
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Location</p>
                  <p className="text-gray-600">{configuration?.contactInfo?.location || about?.location || 'Your City, Country'}</p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            {(configuration?.socialLinks || about?.socialLinks) && (
              <div className="pt-8 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Follow Me</h4>
                <div className="flex space-x-4">
                  {(configuration?.socialLinks?.github || about?.socialLinks?.github) && (
                    <a
                      href={configuration?.socialLinks?.github || about?.socialLinks?.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-gray-100 hover:bg-primary-600 hover:text-white rounded-lg flex items-center justify-center transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </a>
                  )}
                  {(configuration?.socialLinks?.linkedin || about?.socialLinks?.linkedin) && (
                    <a
                      href={configuration?.socialLinks?.linkedin || about?.socialLinks?.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-gray-100 hover:bg-primary-600 hover:text-white rounded-lg flex items-center justify-center transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>
                  )}
                  {(configuration?.socialLinks?.twitter || about?.socialLinks?.twitter) && (
                    <a
                      href={configuration?.socialLinks?.twitter || about?.socialLinks?.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-gray-100 hover:bg-primary-600 hover:text-white rounded-lg flex items-center justify-center transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                    </a>
                  )}
                  {(configuration?.socialLinks?.website || about?.socialLinks?.website) && (
                    <a
                      href={configuration?.socialLinks?.website || about?.socialLinks?.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-gray-100 hover:bg-primary-600 hover:text-white rounded-lg flex items-center justify-center transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {/* Contact Form */}
          <AnimatedSection
            direction="right"
            delay={0.2}
            className="space-y-6"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Name"
                  name="name"
                  register={register}
                  errors={errors}
                  validation={{ required: 'Name is required' }}
                  placeholder="Your name"
                  required
                />

                <FormField
                  label="Email"
                  name="email"
                  type="email"
                  register={register}
                  errors={errors}
                  validation={{ 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  }}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <FormField
                label="Subject"
                name="subject"
                register={register}
                errors={errors}
                placeholder="What's this about?"
              />

              <FormField
                label="Message"
                name="message"
                type="textarea"
                register={register}
                errors={errors}
                validation={{ required: 'Message is required' }}
                placeholder="Tell me about your project or just say hello..."
                rows={6}
                required
              />

              {/* Split Button for Email and WhatsApp */}
              <div className="flex space-x-3">
                {/* Email Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  icon={Send}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Sending...' : 'Send Email'}
                </Button>

                {/* WhatsApp Button */}
                <Button
                  type="button"
                  variant="success"
                  size="lg"
                  onClick={() => {
                    const formData = {
                      name: document.getElementById('field-name')?.value || '',
                      email: document.getElementById('field-email')?.value || '',
                      subject: document.getElementById('field-subject')?.value || '',
                      message: document.getElementById('field-message')?.value || ''
                    };
                    
                    // Get phone number from about or configuration data
                    const phoneNumber = about?.phone || configuration?.contactInfo?.phone || about?.socialLinks?.whatsapp || configuration?.socialLinks?.whatsapp;
                    
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
                  }}
                  className="flex-1"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  WhatsApp
                </Button>
              </div>
            </form>
          </AnimatedSection>
        </div>
      </div>
    </motion.section>
  );
};

export default Contact;
