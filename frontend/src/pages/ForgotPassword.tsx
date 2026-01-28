import { useState } from 'react';
import { Link } from 'react-router';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to send reset email');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
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
            <p className="tw-text-white tw-text-opacity-90">Enter your email to receive OTP</p>
          </div>

          {/* Form */}
          <div className="tw-p-8">
            {success ? (
              <div className="tw-text-center">
                <div className="tw-w-16 tw-h-16 tw-bg-primary tw-bg-opacity-10 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-mx-auto tw-mb-4">
                  <span className="tw-text-3xl">✓</span>
                </div>
                <h3 className="tw-text-xl tw-font-semibold tw-text-secondary tw-mb-2">Check Your Email</h3>
                <p className="tw-text-secondary-light tw-mb-6">
                  We've sent a verification code to <strong>{email}</strong>
                </p>
                <Link
                  to="/reset-password"
                  className="tw-inline-block tw-w-full tw-bg-primary tw-text-white tw-py-3 tw-rounded-lg hover:tw-bg-primary-dark tw-transition-colors tw-font-semibold"
                >
                  Enter OTP
                </Link>
              </div>
            ) : (
              <>
                {error && (
                  <div className="tw-bg-danger tw-bg-opacity-10 tw-border tw-border-danger tw-text-danger tw-px-4 tw-py-3 tw-rounded-lg tw-mb-6">
                    {error}
                  </div>
                )}

                <div className="tw-space-y-6">
                  <div>
                    <label className="tw-block tw-text-sm tw-font-medium tw-text-secondary tw-mb-2">
                      Email Address
                    </label>
                    <div className="tw-relative">
                      <FiMail className="tw-absolute tw-left-3 tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-text-secondary-light" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="tw-w-full tw-pl-10 tw-pr-4 tw-py-3 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-primary tw-outline-none tw-transition-colors"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="tw-w-full tw-bg-primary tw-text-white tw-py-3 tw-rounded-lg hover:tw-bg-primary-dark tw-transition-colors tw-font-semibold tw-flex tw-items-center tw-justify-center tw-gap-2 disabled:tw-opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <AiOutlineLoading3Quarters className="tw-animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Code'
                    )}
                  </button>

                  <Link
                    to="/login"
                    className="tw-flex tw-items-center tw-justify-center tw-gap-2 tw-text-sm tw-text-secondary-light hover:tw-text-primary tw-transition-colors"
                  >
                    <FiArrowLeft />
                    Back to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}