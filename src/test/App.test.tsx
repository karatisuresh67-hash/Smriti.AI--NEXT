import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import * as AuthContextModule from '../context/AuthContext';

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders application branding, tagline, and Google sign-in page for unauthenticated visitors', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Smriti AI/i);
    });

    expect(screen.getByText(/Remember what matters\. Let AI handle the rest\./i)).toBeInTheDocument();
    expect(screen.getByText(/Continue with Google/i)).toBeInTheDocument();
    expect(screen.getByText(/Private & isolated with Row Level Security/i)).toBeInTheDocument();
  });

  it('renders the autonomous AI assistant command center when user is authenticated', async () => {
    // Mock authenticated user session
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'test-user-123',
        email: 'user@astraminds.com',
        user_metadata: { full_name: 'Astra User' }
      } as any,
      profile: { display_name: 'Astra User' } as any,
      session: {} as any,
      loading: false,
      isConfigured: true,
      error: null,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      clearError: vi.fn(),
      saveProfile: vi.fn(),
      updatePassword: vi.fn(),
      requestPasswordReset: vi.fn(),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Astra User/i)).toBeInTheDocument();
      expect(screen.getByText(/Smriti AI • Online & Grounded/i)).toBeInTheDocument();
      expect(screen.getByText(/Agent Architecture Status/i)).toBeInTheDocument();
      expect(screen.getByText(/Today's Directives/i)).toBeInTheDocument();
      expect(screen.getByText(/Autonomous AI Assistant/i)).toBeInTheDocument();
    });
  });
});
