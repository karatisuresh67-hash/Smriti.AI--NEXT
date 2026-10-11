import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import * as apiService from '../services/apiService';

vi.mock('../services/apiService');

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders application branding and header elements', async () => {
    vi.spyOn(apiService, 'fetchHealthCheck').mockResolvedValue({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: 12.5,
      environment: 'development',
      services: {
        geminiConfigured: true,
        geminiModel: 'gemini-3.8-flash',
        supabaseConfigured: false,
      },
      version: '0.1.0',
    });

    render(<App />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Smriti AI/i);
    expect(screen.getAllByText(/Next/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Remember what matters\. Let AI handle the rest\./i).length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(screen.getByText('Backend Health & Environment')).toBeInTheDocument();
      expect(screen.getByText('Real Gemini API Test')).toBeInTheDocument();
    });
  });

  it('renders health check data when API succeeds', async () => {
    vi.spyOn(apiService, 'fetchHealthCheck').mockResolvedValue({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: 10,
      environment: 'development',
      services: {
        geminiConfigured: true,
        geminiModel: 'gemini-3.8-flash',
        supabaseConfigured: false,
      },
      version: '0.1.0',
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Detected on Server')).toBeInTheDocument();
      expect(screen.getByText('gemini-3.8-flash')).toBeInTheDocument();
    });
  });
});
