import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary } from '../ErrorBoundary';
import { CurrencyError, CurrencyErrorCode } from '@/lib/errors';

// Mock the error logger
vi.mock('@/lib/utils/errorLogger', () => ({
  logError: vi.fn().mockReturnValue('error-id-123')
}));

// Component that throws an error
function ThrowError({ shouldThrow = false, error }: { shouldThrow?: boolean; error?: Error }) {
  if (shouldThrow) {
    throw error || new Error('Test error');
  }
  return <div>No error</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render error fallback when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should use custom fallback component', () => {
    const CustomFallback = ({ error, onRetry }: { error: Error; onRetry: () => void }) => (
      <div>
        <span>Custom error: {error.message}</span>
        <button onClick={onRetry}>Custom Retry</button>
      </div>
    );

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} error={new Error('Custom error message')} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error: Custom error message')).toBeInTheDocument();
    expect(screen.getByText('Custom Retry')).toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} error={new Error('Test error')} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test error' }),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('should have retry button when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    
    // Test that retry button is clickable
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeEnabled();
  });

  it('should handle CurrencyError specifically', () => {
    const currencyError = new CurrencyError(
      'API unavailable',
      CurrencyErrorCode.API_UNAVAILABLE
    );

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} error={currencyError} />
      </ErrorBoundary>
    );

    // The error boundary should show the generic error display for CurrencyError
    // since it doesn't have special handling for it
    expect(screen.getByText('Currency Service Unavailable')).toBeInTheDocument();
  });
});

describe('withErrorBoundary', () => {
  it('should wrap component with error boundary', () => {
    const TestComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Wrapped component error');
      }
      return <div>Wrapped component</div>;
    };

    const WrappedComponent = withErrorBoundary(TestComponent);

    const { rerender } = render(<WrappedComponent shouldThrow={false} />);
    expect(screen.getByText('Wrapped component')).toBeInTheDocument();

    rerender(<WrappedComponent shouldThrow={true} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should use custom error boundary props', () => {
    const onError = vi.fn();
    const CustomFallback = ({ error }: { error: Error }) => (
      <div>Custom fallback: {error.message}</div>
    );

    const TestComponent = () => {
      throw new Error('Test error');
    };

    const WrappedComponent = withErrorBoundary(TestComponent, {
      onError,
      fallback: CustomFallback
    });

    render(<WrappedComponent />);

    expect(screen.getByText('Custom fallback: Test error')).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();
  });

  it('should set correct display name', () => {
    const TestComponent = () => <div>Test</div>;
    TestComponent.displayName = 'TestComponent';

    const WrappedComponent = withErrorBoundary(TestComponent);

    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
  });
});