import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name) {
      newErrors.name = 'שם הוא שדה חובה'
    } else if (formData.name.length < 2) {
      newErrors.name = 'שם חייב להכיל לפחות 2 תווים'
    }

    if (!formData.email) {
      newErrors.email = 'אימייל הוא שדה חובה'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'אימייל לא תקין'
    }

    if (!formData.password) {
      newErrors.password = 'סיסמה היא שדה חובה'
    } else if (formData.password.length < 6) {
      newErrors.password = 'סיסמה חייבת להכיל לפחות 6 תווים'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'אנא אשרו את הסיסמה'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'הסיסמאות לא תואמות'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const { name, email, password } = formData
      await signup({ name, email, password })
      navigate('/home')
    } catch (error) {
      setErrors({ submit: error.message || 'שגיאה בהרשמה. אנא נסה שוב.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-origami-gradient-soft flex items-center justify-center px-4 py-12" dir="rtl">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-origami-sage to-origami-mint rounded-origami-lg shadow-origami-lg mb-4 transform -rotate-3">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-4xl font-display font-bold text-gray-800 mb-2">
            הרשמה
          </h1>
          <p className="text-gray-600 font-medium">
            צרו חשבון חדש כדי להתחיל
          </p>
        </div>

        {/* Signup Form */}
        <div className="origami-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                שם מלא
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`origami-input ${errors.name ? 'border-red-300 bg-red-50/50' : ''}`}
                placeholder="הזינו את שמכם המלא"
                dir="rtl"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                אימייל
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`origami-input ${errors.email ? 'border-red-300 bg-red-50/50' : ''}`}
                placeholder="הזינו את כתובת האימייל שלכם"
                dir="ltr"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                סיסמה
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`origami-input ${errors.password ? 'border-red-300 bg-red-50/50' : ''}`}
                placeholder="הזינו סיסמה (לפחות 6 תווים)"
                dir="ltr"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                אישור סיסמה
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`origami-input ${errors.confirmPassword ? 'border-red-300 bg-red-50/50' : ''}`}
                placeholder="הזינו שוב את הסיסמה"
                dir="ltr"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-origami p-3">
                <p className="text-sm text-red-600 font-medium">{errors.submit}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full origami-button-secondary py-3 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin ml-3 -mr-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  נרשם...
                </span>
              ) : (
                'הרשמה'
              )}
            </button>
          </form>
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            כבר יש לכם חשבון?{' '}
            <Link
              to="/login"
              className="text-purple-600 hover:text-purple-700 font-semibold transition-colors"
            >
              התחברו כאן
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
