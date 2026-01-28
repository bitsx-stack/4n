import { useState } from "react";

interface ErrorPageProps {
  errorType?:
    | "network"
    | "notFound"
    | "server"
    | "forbidden"
    | "unauthorized"
    | "generic";
  errorCode?: string;
  errorMessage?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  errorType = "generic",
  errorCode,
  errorMessage,
  onRetry,
  onGoHome,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleRetry = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      onRetry?.();
    }, 600);
  };

  const errorConfigs = {
  network: {
    code: "503",
    title: "Network Error",
    message: errorMessage ?? "Please check your internet connection.",
    icon: "🌐",
    headerBg: "tw-bg-secondary",
    buttonBg: "tw-bg-secondary hover:tw-bg-secondary-dark",
  },
  notFound: {
    code: "404",
    title: "Page Not Found",
    message: errorMessage ?? "The page you are looking for doesn't exist.",
    icon: "🔍",
    headerBg: "tw-bg-primary",
    buttonBg: "tw-bg-primary hover:tw-bg-primary-dark",
  },
  server: {
    code: "500",
    title: "Server Error",
    message: errorMessage ?? "The server encountered an error.",
    icon: "⚠️",
    headerBg: "tw-bg-danger",
    buttonBg: "tw-bg-danger hover:tw-bg-danger-dark",
  },
  forbidden: {
    code: "403",
    title: "Access Forbidden",
    message: errorMessage ?? "You don’t have permission to access this resource.",
    icon: "🚫",
    headerBg: "tw-bg-danger",
    buttonBg: "tw-bg-danger hover:tw-bg-danger-dark",
  },
  unauthorized: {
    code: "401",
    title: "Unauthorized",
    message: errorMessage ?? "Invalid or expired credentials.",
    icon: "🔒",
    headerBg: "tw-bg-secondary",
    buttonBg: "tw-bg-secondary hover:tw-bg-secondary-dark",
  },
  generic: {
    code: "ERROR",
    title: "Something Went Wrong",
    message: errorMessage ?? "An unexpected error occurred.",
    icon: "❌",
    headerBg: "tw-bg-secondary",
    buttonBg: "tw-bg-secondary hover:tw-bg-secondary-dark",
  },
};


  const config = errorConfigs[errorType];
  const displayCode = config.code;
  const displayMessage = config.message;

  return (
    <div className="tw-min-h-screen tw-bg-gradient-to-br tw-from-gray-50 tw-to-gray-100 tw-flex tw-items-center tw-justify-center tw-p-4">
      <div className="tw-max-w-2xl tw-w-full">
        {/* Error Card */}
        <div className="tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-overflow-hidden">
          {/* Header with Dynamic Color Based on Error Type */}
          <div
            className={`${config.headerBg} tw-p-8 tw-text-white tw-relative tw-overflow-hidden`}
          >
            <div className="tw-absolute tw-top-0 tw-right-0 tw-w-32 tw-h-32 tw-bg-white tw-opacity-10 tw-rounded-full -tw-mr-16 -tw-mt-16"></div>
            <div className="tw-absolute tw-bottom-0 tw-left-0 tw-w-24 tw-h-24 tw-bg-white tw-opacity-10 tw-rounded-full -tw-ml-12 -tw-mb-12"></div>

            <div className="tw-relative tw-z-10 tw-text-center">
              <div className="tw-text-6xl tw-mb-4 tw-animate-bounce">
                {config.icon}
              </div>
              <div className="tw-text-8xl tw-font-bold tw-mb-2 tw-opacity-90">
                {displayCode}
              </div>
              <h1 className="tw-text-3xl tw-font-bold">{config.title}</h1>
            </div>
          </div>

          {/* Content */}
          <div className="tw-p-8">
            <p className="tw-text-secondary tw-text-center tw-text-lg tw-mb-8">
              {displayMessage}
            </p>

            {/* Action Buttons */}
            <div className="tw-flex tw-flex-col sm:tw-flex-row tw-gap-4 tw-justify-center">
              {onRetry && (
                <button
                  onClick={handleRetry}
                  disabled={isAnimating}
                  className={`
                    tw-px-8 tw-py-3 tw-rounded-lg tw-font-semibold tw-text-white
                    ${config.buttonBg}
                    hover:tw-shadow-lg tw-transform hover:-tw-translate-y-0.5 
                    tw-transition-all tw-duration-200
                    ${isAnimating ? "tw-animate-spin" : ""}
                  `}
                >
                  {isAnimating ? "🔄" : "🔄 Try Again"}
                </button>
              )}

              {onGoHome && (
                <button
                  onClick={onGoHome}
                  className="
                    tw-px-8 tw-py-3 tw-rounded-lg tw-font-semibold
                    tw-bg-secondary-light tw-text-white
                    hover:tw-bg-secondary hover:tw-shadow-lg
                    tw-transform hover:-tw-translate-y-0.5
                    tw-transition-all tw-duration-200
                  "
                >
                  🏠 Go Home
                </button>
              )}
            </div>

            {/* Additional Help */}
            {/* <div className="tw-mt-8 tw-pt-8 tw-border-t tw-border-gray-200">
              <div className="tw-text-center tw-text-sm tw-text-secondary-light">
                <p className="tw-mb-2">Need help?</p>
                <div className="tw-flex tw-flex-wrap tw-justify-center tw-gap-4">
                  <a
                    href="/"
                    className="tw-text-primary hover:tw-text-primary-dark tw-underline"
                  >
                    Contact Support
                  </a>
                  <span className="tw-text-gray-300">•</span>
                  <a
                    href="/"
                    className="tw-text-primary hover:tw-text-primary-dark tw-underline"
                  >
                    Documentation
                  </a>
                  <span className="tw-text-gray-300">•</span>
                  <a
                    href="/"
                    className="tw-text-primary hover:tw-text-primary-dark tw-underline"
                  >
                    Status Page
                  </a>
                </div>
              </div>
            </div> */}
          </div>
        </div>

        {/* Error ID for debugging */}
        {errorCode && (
          <div className="tw-mt-4 tw-text-center tw-text-xs tw-text-gray-400">
            Error ID: {errorCode}-{Date.now().toString(36)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorPage;
