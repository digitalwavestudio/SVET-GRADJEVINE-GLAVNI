import React from 'react';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { AuthProvider } from '@/src/context/AuthContext';
import { MessagesProvider } from '@/src/context/MessagesContext';
import { BrandProvider } from '@/src/context/BrandContext';
import { ToastProvider } from '@/src/context/ToastContext';
import { VisibilityAbortProvider } from '@/src/context/VisibilityAbortContext';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrandProvider>
          <AuthProvider>
            <MessagesProvider>
              <VisibilityAbortProvider>
                {children}
              </VisibilityAbortProvider>
            </MessagesProvider>
          </AuthProvider>
        </BrandProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};
