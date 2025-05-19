import { AlertCircle } from 'lucide-react';
import type React from 'react';
import { createContext, useContext, useState } from 'react';

import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

interface ErrorContextType {
  showError: (error: ErrorPayloadType) => void;
  clearError: () => void;
}

type SeverityType = 'low' | 'medium' | 'high';
interface ErrorPayloadType {
  /**
   * Human-readable error message
   */
  message: string;
  /**
   * Error code for categorization
   */
  code: string;
  /**
   * When the error occurred
   */
  timestamp: number;
  /**
   * Error severity level
   */
  severity: SeverityType;
  /**
   * Additional context about where/why the error occurred
   */
  context?: {
    /**
     * User who encountered the error
     */
    userId?: number;
    /**
     * User who received the error
     */
    recipientId?: number;
    /**
     * Chat room where error occurred
     */
    roomId?: string;
    /**
     * Action that triggered the error
     */
    action?: string;
    /**
     * Any additional relevant data
     */
    metadata?: Record<string, unknown>;
  };
  /**
   * Whether the client can recover without refresh
   */
  isRecoverable: boolean;
  /**
   * Whether the action can be retried
   */
  retryable: boolean;
  /**
   * Full error object
   */
  fullError?: string;
}
const ErrorContext = createContext<ErrorContextType | undefined>(undefined);
/**
 * @description This hook is used to show an error dialog to the user.
 * @returns {ErrorContextType} The error context type.
 */
export function useError() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}

/**
 * @description This component is used to show an error dialog to the user.
 * @param {React.ReactNode} children - The children of the error provider.
 * @returns {React.ReactNode} The error provider.
 */
export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<ErrorPayloadType | null>(null);

  const showError = (errorPayload: ErrorPayloadType) => {
    setError(errorPayload);
  };

  const clearError = () => {
    setError(null);
  };

  const handleRetry = () => {
    //TODO: Implement retry
    // biome-ignore lint/suspicious/noConsole: <explanation>
    console.error('Retrying...');
    clearError();
  };
  const navigate = useNavigate();
  const goHome = () => {
    navigate('/');
  };

  return (
    <ErrorContext.Provider value={{ showError, clearError }}>
      {children}
      <Dialog open={!!error} onOpenChange={() => clearError()}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-destructive text-red-500'>
              <AlertCircle className='h-5 w-5 ' />
              Error {error?.code && `(${error.code})`}
            </DialogTitle>
            <DialogDescription className='pt-2'>{error?.message}</DialogDescription>
          </DialogHeader>

          {error?.context && (
            <div className='text-sm text-muted-foreground text-red-500'>
              <h4 className='font-semibold'>Additional Information:</h4>
              <pre className='mt-2 rounded bg-secondary p-2 font-mono text-xs'>
                {JSON.stringify(error.context, null, 2)}
              </pre>
            </div>
          )}

          <DialogFooter className='gap-2 sm:gap-0'>
            {error?.retryable && (
              <Button variant='secondary' onClick={handleRetry}>
                Retry
              </Button>
            )}
            <Button
              variant='default'
              onClick={clearError}
              className='bg-red-500/60 hover:bg-red-500/80 text-white'
            >
              Close
            </Button>
            <Button
              variant='default'
              onClick={goHome}
              className='border bg-background text-sm hover:bg-slate-300/25  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 px-4'
            >
              Go to Home
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ErrorContext.Provider>
  );
}

export const getSeverityStyles = (severity?: SeverityType) => {
  switch (severity) {
    case 'high':
      return 'bg-red-50 border-red-500';
    case 'medium':
      return 'bg-yellow-50 border-yellow-500';
    case 'low':
      return 'bg-blue-50 border-blue-500';
    default:
      return 'bg-gray-50 border-gray-500';
  }
};
