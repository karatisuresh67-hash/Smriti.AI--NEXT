import type { ApiRequest, ApiResponse } from '../_utils/serverTypes.js';
import { validateAuthToken } from '../_utils/auth.js';

/**
 * Serverless API Endpoint: /api/calendar/events
 * Real Google Calendar API v3 synchronization and event management.
 * Communicates directly with Google Calendar REST API using the user's Google OAuth provider token.
 */
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  const method = req.method;

  // Extract Google OAuth access token from header
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  const token = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';

  // Optional: check Supabase user identity
  await validateAuthToken(req);

  if (method === 'GET') {
    if (!token) {
      res.status(200).json({
        synced: false,
        events: [],
        message: 'Google Calendar sync ready. Please sign in with Google to enable real-time calendar synchronization.',
      });
      return;
    }

    try {
      const nowIso = new Date().toISOString();
      const calendarEndpoint = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=50&timeMin=${encodeURIComponent(nowIso)}&singleEvents=true&orderBy=startTime`;
      
      const response = await fetch(calendarEndpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        res.status(200).json({
          synced: false,
          events: [],
          message: errJson?.error?.message || 'Google Calendar token expired or unauthorized. Please re-authenticate.',
          code: 'GOOGLE_AUTH_EXPIRED'
        });
        return;
      }

      const data = await response.json();
      const items = (data.items || []).map((item: any) => ({
        id: item.id,
        title: item.summary || 'Untitled Event',
        start: item.start?.dateTime || item.start?.date,
        end: item.end?.dateTime || item.end?.date,
        allDay: !item.start?.dateTime,
        description: item.description || '',
        location: item.location || '',
        htmlLink: item.htmlLink,
        source: 'google_calendar'
      }));

      res.status(200).json({
        synced: true,
        events: items,
        count: items.length,
      });
    } catch (err: any) {
      console.warn('[Calendar API] Google sync exception:', err);
      res.status(200).json({
        synced: false,
        events: [],
        error: err.message,
      });
    }
    return;
  }

  if (method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        res.status(400).json({ error: 'Invalid JSON request body.' });
        return;
      }
    }

    const { title, date, time, description, location } = body || {};
    if (!title || !date) {
      res.status(400).json({ error: 'title and date are required.' });
      return;
    }

    if (!token) {
      res.status(200).json({
        success: true,
        localOnly: true,
        event: {
          id: `cal-local-${Date.now()}`,
          title,
          date,
          time: time || '09:00',
          description: description || '',
          location: location || '',
        },
        message: `Event "${title}" saved locally. Sign in with Google to synchronize with your Google Calendar.`
      });
      return;
    }

    try {
      // Create real event in Google Calendar v3
      const startDateTime = time ? `${date}T${time}:00` : `${date}T09:00:00`;
      const endDateTime = time ? `${date}T${time.slice(0, 2)}:50:00` : `${date}T10:00:00`;

      const gcalPayload = {
        summary: title,
        description: description || 'Created by Smriti AI',
        location: location || '',
        start: { dateTime: new Date(startDateTime).toISOString() },
        end: { dateTime: new Date(endDateTime).toISOString() }
      };

      const createRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(gcalPayload)
      });

      const gcalData = await createRes.json();

      if (!createRes.ok) {
        throw new Error(gcalData?.error?.message || 'Failed to insert event into Google Calendar.');
      }

      res.status(200).json({
        success: true,
        event: {
          id: gcalData.id,
          title: gcalData.summary,
          htmlLink: gcalData.htmlLink,
          start: gcalData.start?.dateTime,
        },
        message: `Event "${title}" successfully synchronized to Google Calendar!`
      });
    } catch (err: any) {
      res.status(500).json({
        error: err?.message || 'Error creating event on Google Calendar.',
        code: 'GCAL_INSERT_ERROR'
      });
    }
    return;
  }

  res.setHeader('Allow', 'GET, POST');
  res.status(405).json({ error: 'Method Not Allowed.' });
}
