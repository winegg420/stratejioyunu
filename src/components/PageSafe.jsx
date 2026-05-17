import ErrorBoundary from './ErrorBoundary';

export default function PageSafe({ children }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
