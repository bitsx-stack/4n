import { HiOutlineLogout } from 'react-icons/hi';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import api from 'src/utils/api';

interface LogoutButtonProps {
  onLogout?: () => void;
  className?: string;
}

export function LogoutButton({ onLogout, className = '' }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      // Call your logout API here
      await api.post("/auth/logout")
      
      // Clear user data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Call custom logout handler if provided
      onLogout?.();
      
      // Redirect to login
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-bg-danger tw-text-white tw-rounded-lg hover:tw-bg-danger-dark tw-transition-colors tw-font-medium disabled:tw-opacity-50 ${className}`}
    >
      <HiOutlineLogout className="tw-text-xl" />
      {isLoading ? 'Logging out...' : 'Logout'}
    </button>
  );
}