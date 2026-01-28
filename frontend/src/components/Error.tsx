import { useNavigate } from 'react-router';
import ErrorPage from '../components/ErrorPage';

// 404 Not Found Page
export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <ErrorPage
      errorType="notFound"
      onGoHome={() => navigate("/")}
      onRetry={() => navigate(-1)} // Go back to previous page
    />
  );
}

// 401 Unauthorized Page
export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <ErrorPage
      errorType="unauthorized"
      onGoHome={() => navigate("/")}
      onRetry={() => navigate('/login')} // Redirect to login
    />
  );
}

// 403 Forbidden Page
export function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <ErrorPage
      errorType="forbidden"
      onGoHome={() => navigate(-1)}
    />
  );
}

// 500 Server Error Page
export function ServerErrorPage() {
  const navigate = useNavigate();

  return (
    <ErrorPage
      errorType="server"
      onGoHome={() => navigate("/")}
      onRetry={() => window.location.reload()}
    />
  );
}

// 503 Network Error Page
export function NetworkErrorPage() {
  const navigate = useNavigate();

  return (
    <ErrorPage
      errorType="network"
      onGoHome={() => navigate("/")}
      onRetry={() => window.location.reload()}
    />
  );
}