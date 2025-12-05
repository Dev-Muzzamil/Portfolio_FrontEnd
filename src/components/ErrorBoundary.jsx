import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
     
    console.error('ErrorBoundary caught an error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-lg bg-white/90 dark:bg-gray-900/90 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300">
          <h4 className="font-semibold mb-2">Something went wrong loading this section.</h4>
          <div className="text-sm">{String(this.state.error?.message || 'An error occurred.')}</div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
