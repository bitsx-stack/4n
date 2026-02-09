import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { FiLock, FiEye, FiEyeOff, FiPhone } from 'react-icons/fi';
import { Loader } from 'src/components/ui/Loader';
import api from 'src/utils/api';
import ToastNotification from 'src/components/ToastNotification';
import qs from 'qs';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');

  try {
    const response = await api.post("/auth/login", qs.stringify(formData),
  {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  }); // NO stringify

    const data = response.data; // extract data
    console.log("Login response:", data);

    // Save token
    localStorage.setItem("token", data.access_token);

    navigate('/dashboard');
  } catch (err: any) {
    setError(err.friendlyMessage || "Login failed! Please try again...");
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="tw-min-h-screen tw-bg-gradient-to-br tw-from-gray-50 tw-to-gray-100 tw-flex tw-items-center tw-justify-center tw-p-4">
      <div className="tw-w-full tw-max-w-md">
        <div className="tw-bg-white tw-rounded-2xl tw-shadow-xl tw-overflow-hidden">
          {/* Header */}
          <div className="tw-bg-primary tw-px-8 tw-py-6 tw-text-center">
            <h1 className="tw-text-3xl tw-font-bold tw-text-white tw-mb-2">Miliki App | Welcome Back</h1>
            <p className="tw-text-white tw-text-opacity-90">Sign in to your account</p>
          </div>

          {/* Form */}
          <div className="tw-p-8">
            {error && (
              <ToastNotification
                message={error}
                onClose={()=>setError("")}
                type='error'
                duration={3000}
              />
            )}

            <form className="tw-space-y-6">
              {/* Email Input */}
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-secondary tw-mb-2">
                  Phone
                </label>
                <div className="tw-relative">
                  <FiPhone className="tw-absolute tw-left-3 tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-text-secondary-light" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="tw-w-full tw-pl-10 tw-pr-4 tw-py-3 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-primary tw-outline-none tw-transition-colors"
                    placeholder="07XXXXXXXX"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-secondary tw-mb-2">
                  Password
                </label>
                <div className="tw-relative">
                  <FiLock className="tw-absolute tw-left-3 tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-text-secondary-light" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="tw-w-full tw-pl-10 tw-pr-12 tw-py-3 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-primary tw-outline-none tw-transition-colors"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="tw-absolute tw-right-3 tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-text-secondary-light hover:tw-text-secondary"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="tw-text-right">
                <Link
                  to="/forgot-password"
                  className="tw-text-sm tw-text-primary hover:tw-text-primary-dark tw-font-medium"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="tw-w-full tw-bg-primary tw-text-white tw-py-3 tw-rounded-lg hover:tw-bg-primary-dark tw-transition-colors tw-font-semibold tw-flex tw-items-center tw-justify-center tw-gap-2 disabled:tw-opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader size='md' message='Signing in...'/>
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

              {/* Register Link */}
              <p className="tw-text-center tw-text-sm tw-text-secondary-light">
                Don't have an account?{' '}
                <Link to="/register" className="tw-text-primary hover:tw-text-primary-dark tw-font-medium">
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}