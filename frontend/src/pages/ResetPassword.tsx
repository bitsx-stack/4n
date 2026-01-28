import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    otp: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate OTP
    if (formData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otp: formData.otp,
          newPassword: formData.password,
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid OTP or reset failed');
      }

      // Redirect to login
      navigate('/login', { state: { message: 'Password reset successful! Please login.' } });
    } catch (err: any) {
      setError(err.message || 'Reset failed. Please try again.');
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
            <h1 className="tw-text-3xl tw-font-bold tw-text-white tw-mb-2">Reset Password</h1>
            <p className="tw-text-white tw-text-opacity-90">Enter OTP and new password</p>
          </div>

          {/* Form */}
          <div className="tw-p-8">
            {error && (
              <div className="tw-bg-danger tw-bg-opacity-10 tw-border tw-border-danger tw-text-danger tw-px-4 tw-py-3 tw-rounded-lg tw-mb-6">
                {error}
              </div>
            )}

            <div className="tw-space-y-6">
              {/* OTP Input */}
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-secondary tw-mb-2">
                  Verification Code (OTP)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={formData.otp}
                  onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                  className="tw-w-full tw-px-4 tw-py-3 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-primary tw-outline-none tw-transition-colors tw-text-center tw-text-2xl tw-tracking-widest tw-font-semibold"
                  placeholder="000000"
                  required
                />
                <p className="tw-text-xs tw-text-secondary-light tw-mt-2">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              {/* New Password */}
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-secondary tw-mb-2">
                  New Password
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

              {/* Confirm Password */}
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-secondary tw-mb-2">
                  Confirm Password
                </label>
                <div className="tw-relative">
                  <FiLock className="tw-absolute tw-left-3 tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-text-secondary-light" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="tw-w-full tw-pl-10 tw-pr-12 tw-py-3 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-primary tw-outline-none tw-transition-colors"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="tw-absolute tw-right-3 tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-text-secondary-light hover:tw-text-secondary"
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="tw-w-full tw-bg-primary tw-text-white tw-py-3 tw-rounded-lg hover:tw-bg-primary-dark tw-transition-colors tw-font-semibold tw-flex tw-items-center tw-justify-center tw-gap-2 disabled:tw-opacity-50"
              >
                {isLoading ? (
                  <>
                    <AiOutlineLoading3Quarters className="tw-animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>

              <div className="tw-text-center">
                <Link
                  to="/forgot-password"
                  className="tw-text-sm tw-text-primary hover:tw-text-primary-dark tw-font-medium"
                >
                  Didn't receive code? Resend
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
