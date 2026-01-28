import { useEffect } from 'react';
import { FiX } from 'react-icons/fi';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'tw-max-w-md',
    md: 'tw-max-w-2xl',
    lg: 'tw-max-w-4xl',
    xl: 'tw-max-w-6xl',
  };

  return (
    <div className="tw-fixed tw-inset-0 tw-z-50 tw-overflow-y-auto">
      {/* Backdrop */}
      <div
        className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-transition-opacity"
      />

      {/* Modal */}
      <div className="tw-flex tw-min-h-full tw-items-center tw-justify-center tw-p-4">
        <div
          className={`tw-relative tw-w-full ${sizes[size]} tw-bg-white tw-rounded-xl tw-shadow-2xl tw-transform tw-transition-all`}
        >
          {/* Header */}
          <div className="tw-flex tw-items-center tw-justify-between tw-px-6 tw-py-4 tw-border-b tw-border-gray-200">
            <h3 className="tw-text-xl tw-font-semibold tw-text-secondary">{title}</h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="tw-text-secondary-light hover:tw-text-secondary tw-transition-colors"
              >
                <FiX className="tw-text-2xl" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="tw-px-6 tw-py-4 tw-max-h-[calc(100vh-200px)] tw-overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}