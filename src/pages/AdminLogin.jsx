import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { api } from '../services/api'

const AdminLogin = ({ setIsAuthenticated }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const response = await api.post('/auth/login', data)
      localStorage.setItem('token', response.data.token)
      setIsAuthenticated(true)
      toast.success('Login successful!')
    } catch (error) {
      console.error('Login error:', error)
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (localStorage.getItem('token')) {
    return <Navigate to="/admin" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-ink/5 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-ink text-paper rounded-full flex items-center justify-center mb-6 shadow-xl">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-ink mb-2">
            Admin Access
          </h2>
          <p className="font-sans text-sm text-ink/60 tracking-wide">
            Enter your credentials to continue
          </p>
        </div>

        <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl sm:rounded-3xl p-8 shadow-xl dark:shadow-strong-dark">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block font-sans text-xs font-bold uppercase tracking-widest text-gray mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className="block w-full px-4 py-3 bg-paper/50 border border-ink/10 rounded-lg focus:ring-2 focus:ring-accent/50 focus:border-accent text-ink placeholder-ink/30 transition-all outline-none"
                  placeholder="admin@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500 font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block font-sans text-xs font-bold uppercase tracking-widest text-gray mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    {...register('password', { required: 'Password is required' })}
                    className="block w-full px-4 py-3 bg-paper/50 border border-ink/10 rounded-lg focus:ring-2 focus:ring-accent/50 focus:border-accent text-ink placeholder-ink/30 transition-all outline-none pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink/40 hover:text-ink transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500 font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent font-sans text-xs font-bold uppercase tracking-widest rounded-full text-paper bg-ink hover:bg-accent hover:text-paper focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ink transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-paper mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default AdminLogin