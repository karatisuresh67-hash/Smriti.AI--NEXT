import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders application branding, tagline, and Google sign-in page for unauthenticated visitors', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Smriti AI/i);
    expect(screen.getByText(/Remember what matters\. Let AI handle the rest\./i)).toBeInTheDocument();
    expect(screen.getByText(/Continue with Google/i)).toBeInTheDocument();
  });

  it('allows access to dashboard via local demo mode with sample memories and reminders', async () => {
    render(<App />);

    // Click "Continue in Local Demo Mode"
    const guestBtn = screen.getByText(/Continue in Local Demo Mode/i);
    fireEvent.click(guestBtn);

    await waitFor(() => {
      expect(screen.getByText(/Ask Smriti Anything About Your Memories/i)).toBeInTheDocument();
      expect(screen.getByText(/Saved Memories/i)).toBeInTheDocument();
      expect(screen.getByText(/Due Today/i)).toBeInTheDocument();
      expect(screen.getByText(/Quick Add Memory/i)).toBeInTheDocument();
      expect(screen.getByText(/Quick Add Reminder/i)).toBeInTheDocument();
      expect(screen.getByText(/Active & Upcoming Reminders/i)).toBeInTheDocument();
    });
  });
});
