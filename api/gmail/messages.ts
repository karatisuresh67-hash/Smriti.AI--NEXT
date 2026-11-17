import type { ApiRequest, ApiResponse } from '../_utils/serverTypes';
import { validateAuthToken } from '../_utils/auth';

/**
 * Serverless API Endpoint: /api/gmail/messages
 * Interfaces directly with the Google Gmail REST API v1 using the user's Google OAuth provider token.
 * Supports:
 * - GET: Fetch recent/unread messages with Subject, From, Snippet, Date
 * - POST: Create email drafts or send emails (with explicit human authorization)
 */
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  const method = req.method;

  // Extract Google OAuth provider token from authorization header
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  const token = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';

  // Optional Supabase user validation
  await validateAuthToken(req);

  if (method === 'GET') {
    if (!token) {
      res.status(200).json({
        synced: false,
        messages: [],
        message: 'Gmail synchronization ready. Please sign in with Google to enable real-time inbox access.',
      });
      return;
    }

    try {
      const listRes = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=10',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!listRes.ok) {
        const errJson = await listRes.json().catch(() => ({}));
        res.status(200).json({
          synced: false,
          messages: [],
          message: errJson?.error?.message || 'Gmail access token expired or missing scope. Please re-authenticate.',
          code: 'GMAIL_AUTH_EXPIRED',
        });
        return;
      }

      const listData = await listRes.json();
      const messageList = listData.messages || [];

      // Fetch headers and snippet for each email (up to 10 in parallel)
      const detailedMessages = await Promise.all(
        messageList.map(async (item: { id: string; threadId: string }) => {
          try {
            const msgRes = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json',
                },
              }
            );
            if (!msgRes.ok) return null;
            const msgData = await msgRes.json();
            const headers = msgData.payload?.headers || [];

            const subjectHeader = headers.find((h: any) => h.name?.toLowerCase() === 'subject');
            const fromHeader = headers.find((h: any) => h.name?.toLowerCase() === 'from');
            const dateHeader = headers.find((h: any) => h.name?.toLowerCase() === 'date');

            return {
              id: msgData.id,
              threadId: msgData.threadId,
              snippet: msgData.snippet || '',
              subject: subjectHeader?.value || '(No Subject)',
              from: fromHeader?.value || 'Unknown Sender',
              date: dateHeader?.value || msgData.internalDate,
              isUnread: (msgData.labelIds || []).includes('UNREAD'),
            };
          } catch {
            return null;
          }
        })
      );

      const filtered = detailedMessages.filter(Boolean);

      res.status(200).json({
        synced: true,
        messages: filtered,
        count: filtered.length,
      });
    } catch (err: any) {
      console.warn('[Gmail API] Error fetching messages:', err);
      res.status(500).json({
        synced: false,
        messages: [],
        error: err?.message || 'Error communicating with Google Gmail API.',
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

    const { to, subject = 'Message from Smriti AI', content = '', action = 'draft' } = body || {};

    if (!to) {
      res.status(400).json({ error: 'Recipient "to" email address is required.' });
      return;
    }

    if (!token) {
      res.status(401).json({
        error: 'Google OAuth token is required to draft or send emails. Please sign in with Google.',
        code: 'MISSING_GOOGLE_TOKEN',
      });
      return;
    }

    try {
      // Build RFC 2822 compliant email string
      const rfc2822 = [
        `To: ${to}`,
        `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=utf-8',
        '',
        content,
      ].join('\r\n');

      const encodedMail = Buffer.from(rfc2822)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      if (action === 'send') {
        const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw: encodedMail }),
        });

        const sendData = await sendRes.json();
        if (!sendRes.ok) {
          throw new Error(sendData?.error?.message || 'Failed to send message via Gmail.');
        }

        res.status(200).json({
          success: true,
          action: 'send',
          messageId: sendData.id,
          message: `Email to ${to} sent successfully!`,
        });
        return;
      }

      // Default to saving as draft
      const draftRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: { raw: encodedMail },
        }),
      });

      const draftData = await draftRes.json();
      if (!draftRes.ok) {
        throw new Error(draftData?.error?.message || 'Failed to save draft in Gmail.');
      }

      res.status(200).json({
        success: true,
        action: 'draft',
        draftId: draftData.id,
        message: `Email draft to ${to} created successfully in Gmail!`,
      });
    } catch (err: any) {
      console.error('[Gmail API] Action error:', err);
      res.status(500).json({
        error: err?.message || 'Error executing Gmail operation.',
        code: 'GMAIL_ACTION_ERROR',
      });
    }
    return;
  }

  res.setHeader('Allow', 'GET, POST');
  res.status(405).json({ error: 'Method Not Allowed' });
}
