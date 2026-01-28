import { AiOutlineLoading3Quarters } from 'react-icons/ai';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  message?: string;
}

export function Loader({ size = 'md', fullScreen = false, message }: LoaderProps) {
  const sizes = {
    sm: 'tw-text-2xl',
    md: 'tw-text-4xl',
    lg: 'tw-text-6xl',
  };

  const content = (
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-4">
      <AiOutlineLoading3Quarters className={`${sizes[size]} tw-text-primary tw-animate-spin`} />
      {message && <p className="tw-text-secondary tw-text-sm">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="tw-fixed tw-inset-0 tw-bg-white tw-bg-opacity-90 tw-flex tw-items-center tw-justify-center tw-z-50">
        {content}
      </div>
    );
  }

  return content;
}
