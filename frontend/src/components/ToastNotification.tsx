import { useEffect } from 'react';

interface ToastNotificationProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

export default function ToastNotification({ message, type, duration = 5000, onClose }: ToastNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    success: 'tw-bg-primary tw-border-primary-dark',
    error: 'tw-bg-danger tw-border-danger-dark',
    warning: 'tw-bg-yellow-500 tw-border-yellow-700',
    info: 'tw-bg-secondary tw-border-secondary-dark',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div className={`${colors[type]} tw-text-white tw-px-6 tw-py-4 tw-rounded-lg tw-shadow-lg tw-border-l-4 tw-flex tw-items-center tw-gap-3`}>
      <span className="tw-text-2xl tw-font-bold">{icons[type]}</span>
      <span className="tw-flex-1">{message}</span>
      <button onClick={onClose} className="tw-text-white hover:tw-text-gray-200 tw-text-xl tw-font-bold">
        ×
      </button>
    </div>
  );
}