import { chromium } from 'playwright';
import { GoogleGenAI } from '@google/genai';
import type { ApiRequest, ApiResponse } from '../_utils/serverTypes.js';
import { getGeminiApiKey, getGeminiModel } from '../_utils/env.js';
import { validateAuthToken } from '../_utils/auth.js';

interface AgentStep {
  step: number;
  action: string;
  target?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting_approval';
  detail?: string;
  timestamp: string;
}

/**
 * Serverless API Endpoint: /api/browser/agent
 * Autonomous Cloud Browser Agent powered by Browserbase + Playwright + Gemini.
 * Executes multi-step browser loops: inspects live page DOM, interacts (click, type, scroll),
 * extracts structured information, captures screenshots, and enforces human-in-the-loop safety.
 */
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method Not Allowed. Only POST is accepted.' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ error: 'Invalid JSON request body.' });
      return;
    }
  }

  const {
    instruction,
    url: initialUrl,
    approved = false,
    executionId = `exec-${Date.now()}`
  } = body || {};

  if (!instruction || typeof instruction !== 'string') {
    res.status(400).json({ error: 'instruction is required.' });
    return;
  }

  // Validate optional session authentication
  const auth = await validateAuthToken(req);
  const activeUserId = auth.userId || 'anonymous-user';

  const apiKey = getGeminiApiKey();
  const modelName = getGeminiModel() || 'gemini-2.5-flash';
  const steps: AgentStep[] = [];

  const logStep = (action: string, target?: string, status: AgentStep['status'] = 'completed', detail?: string) => {
    steps.push({
      step: steps.length + 1,
      action,
      target,
      status,
      detail,
      timestamp: new Date().toISOString(),
    });
  };

  logStep('Initialize Agent', 'Browser Core', 'completed', `User [${activeUserId.slice(0, 8)}]: "${instruction}"`);

  // Detect or formulate target URL
  let targetUrl = initialUrl;
  if (!targetUrl) {
    const urlMatch = instruction.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      targetUrl = urlMatch[0];
    } else {
      const domainMatch = instruction.match(/\b([a-zA-Z0-9-]+\.(com|org|io|net|edu|dev|ai))\b/i);
      if (domainMatch) {
        targetUrl = `https://${domainMatch[0]}`;
      } else {
        targetUrl = `https://www.google.com/search?q=${encodeURIComponent(instruction)}`;
      }
    }
  }

  // Pre-execution safety check for irreversible mutations
  const MUTATION_KEYWORDS = ['submit', 'post', 'publish', 'buy', 'purchase', 'order', 'delete', 'send message', 'confirm order'];
  const isMutatingInstruction = MUTATION_KEYWORDS.some(kw => instruction.toLowerCase().includes(kw));

  if (isMutatingInstruction && !approved) {
    logStep(
      'Safety Guard Triggered',
      targetUrl,
      'waiting_approval',
      'Action detected consequential mutation (publish/send/submit). Explicit user confirmation required.'
    );

    res.status(200).json({
      id: executionId,
      userId: activeUserId,
      taskTitle: `Browse & Action: ${targetUrl}`,
      instruction,
      targetSystem: targetUrl,
      status: 'waiting_approval',
      steps,
      resultSummary: 'This autonomous action requires your explicit confirmation before executing mutations on the target website.',
      requiresApproval: true,
      startedAt: new Date().toISOString(),
    });
    return;
  }

  let browser: any = null;
  let context: any = null;
  let page: any = null;
  let screenshotBase64 = '';

  try {
    const browserbaseApiKey = process.env.BROWSERBASE_API_KEY;
    const browserbaseProjectId = process.env.BROWSERBASE_PROJECT_ID;

    // Connect to Browserbase Cloud Browser if configured, else fallback to Playwright local
    if (browserbaseApiKey && browserbaseProjectId) {
      logStep('Connect Cloud Browser', 'Browserbase CDP', 'running', 'Connecting to remote isolated cloud browser session...');
      const endpoint = `wss://connect.browserbase.com?apiKey=${browserbaseApiKey}&projectId=${browserbaseProjectId}`;
      browser = await chromium.connectOverCDP(endpoint, { timeout: 20000 });
      context = browser.contexts()[0] || (await browser.newContext());
      page = await context.newPage();
      logStep('Cloud Session Online', 'Browserbase', 'completed', 'Connected to secure remote browser container.');
    } else {
      logStep('Launch Headless Browser', 'Playwright Engine', 'running', 'Starting local Playwright sandboxed browser instance...');
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 }
      });
      page = await context.newPage();
      logStep('Local Browser Active', 'Chromium', 'completed', 'Headless context initialized.');
    }

    // Step 1: Navigate to target URL
    logStep('Navigate Target URL', targetUrl, 'running', `Opening ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
    logStep('Page Loaded', targetUrl, 'completed', 'DOM content loaded successfully.');

    await page.waitForTimeout(1000);

    // Capture initial screenshot
    try {
      const scr = await page.screenshot({ type: 'png', fullPage: false });
      screenshotBase64 = `data:image/png;base64,${scr.toString('base64')}`;
      logStep('Capture Viewport', targetUrl, 'completed', 'Viewport preview captured.');
    } catch (e: any) {
      console.warn('[Browser Agent] Initial screenshot warning:', e?.message);
    }

    // Interactive Autonomous Execution Loop (Up to 3 multi-step interactions)
    let aiSummary = '';
    const MAX_INTERACTIONS = 3;

    for (let iteration = 1; iteration <= MAX_INTERACTIONS; iteration++) {
      const pageTitle = await page.title();

      // Extract interactable DOM summary (visible inputs, buttons, headings, links)
      const domSnapshot = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input, textarea')).map((el, i) => {
          const inp = el as HTMLInputElement;
          return `[INPUT #${i}] name="${inp.name}" placeholder="${inp.placeholder}" type="${inp.type}" id="${inp.id}"`;
        }).slice(0, 8).join('\n');

        const buttons = Array.from(document.querySelectorAll('button, a[href], input[type="submit"]')).map((el, i) => {
          const txt = (el as HTMLElement).innerText?.trim() || (el as HTMLInputElement).value || '';
          return `[BTN #${i}] text="${txt.slice(0, 30)}"`;
        }).filter(b => b.length > 15).slice(0, 10).join('\n');

        const textSnippet = document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 6000);
        return { inputs, buttons, textSnippet };
      });

      if (!apiKey) {
        aiSummary = `Navigated to ${targetUrl} (${pageTitle}). Extracted ${domSnapshot.textSnippet.length} characters of page text.`;
        break;
      }

      // Reasoning prompt for next action decision
      const decisionPrompt = `You are Smriti AI's autonomous browser agent.
User Instruction: "${instruction}"
Current URL: "${page.url()}"
Page Title: "${pageTitle}"

Interactable Page Elements:
Inputs:
${domSnapshot.inputs || '(none)'}

Buttons & Links:
${domSnapshot.buttons || '(none)'}

Page Content Snippet:
${domSnapshot.textSnippet.slice(0, 2500)}

Decide the best next action:
- "finish": if the page already answers the user's objective or contains the needed information.
- "click": click a specific button/link (specify targetText or CSS selector).
- "type": type into an input field (specify targetInput and textToType).
- "scroll": scroll down to load more content.

Respond strictly in valid JSON:
{
  "action": "finish" | "click" | "type" | "scroll",
  "target": "text or selector",
  "textToType": "...",
  "reasoning": "...",
  "answerIfFinished": "concise answer to user's instruction based on page content"
}`;

      const ai = new GoogleGenAI({ apiKey });
      const decRes = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: decisionPrompt }] }],
        config: { responseMimeType: 'application/json', maxOutputTokens: 1024 }
      });

      let decision: any;
      try {
        decision = JSON.parse(decRes.text || '{}');
      } catch {
        decision = { action: 'finish', answerIfFinished: domSnapshot.textSnippet.slice(0, 500) };
      }

      // Check if decided action requires human confirmation
      const isDangerousClick = decision.action === 'click' && 
        MUTATION_KEYWORDS.some(kw => (decision.target || '').toLowerCase().includes(kw));

      if (isDangerousClick && !approved) {
        logStep(
          'Safety Gate Paused',
          decision.target,
          'waiting_approval',
          `Autonomous agent proposed clicking "${decision.target}". Paused for human approval.`
        );

        res.status(200).json({
          id: executionId,
          userId: activeUserId,
          taskTitle: `Browse: ${pageTitle || targetUrl}`,
          instruction,
          targetSystem: page.url(),
          status: 'waiting_approval',
          steps,
          resultSummary: `Autonomous agent prepared to execute: Click "${decision.target}". Please approve to proceed.`,
          screenshotUrl: screenshotBase64 || undefined,
          requiresApproval: true,
          startedAt: new Date().toISOString(),
        });
        return;
      }

      if (decision.action === 'finish') {
        aiSummary = decision.answerIfFinished || `Visited ${page.url()} (${pageTitle}). Objective verified.`;
        logStep('Mission Completed', page.url(), 'completed', decision.reasoning || 'Information extracted successfully.');
        break;
      }

      if (decision.action === 'scroll') {
        logStep('Scroll Page', page.url(), 'running', 'Scrolling viewport to reveal additional content...');
        await page.evaluate(() => window.scrollBy(0, 700));
        await page.waitForTimeout(1000);
        logStep('Scroll Completed', page.url(), 'completed', 'Page scrolled.');
        continue;
      }

      if (decision.action === 'click' && decision.target) {
        logStep('Click Element', decision.target, 'running', `Attempting to click "${decision.target}"...`);
        try {
          // Attempt text match click first, then selector
          const target = decision.target.trim();
          const clicked = await page.getByText(target, { exact: false }).first().click({ timeout: 5000 })
            .then(() => true)
            .catch(() => page.click(target, { timeout: 4000 }).then(() => true).catch(() => false));

          if (clicked) {
            await page.waitForTimeout(1500);
            logStep('Click Succeeded', target, 'completed', `Clicked element "${target}".`);
          } else {
            logStep('Click Skipped', target, 'completed', `Element "${target}" not directly clickable, continuing inspection.`);
          }
        } catch (e: any) {
          logStep('Click Notice', decision.target, 'completed', `Interaction note: ${e?.message?.slice(0, 60)}`);
        }
        continue;
      }

      if (decision.action === 'type' && decision.textToType) {
        logStep('Type Text', decision.target || 'input', 'running', `Typing "${decision.textToType}"...`);
        try {
          const inputEl = page.locator('input[type="text"], input[type="search"], textarea').first();
          await inputEl.fill(decision.textToType);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2000);
          logStep('Typed & Submitted', decision.textToType, 'completed', 'Input submitted.');
        } catch (e: any) {
          logStep('Type Notice', decision.target || 'input', 'completed', 'Could not fill input.');
        }
        continue;
      }

      // Default fallback
      aiSummary = decision.answerIfFinished || domSnapshot.textSnippet.slice(0, 500);
      break;
    }

    // Refresh final screenshot after multi-step actions
    try {
      const scr = await page.screenshot({ type: 'png', fullPage: false });
      screenshotBase64 = `data:image/png;base64,${scr.toString('base64')}`;
    } catch {}

    const finalTitle = await page.title().catch(() => targetUrl);

    res.status(200).json({
      id: executionId,
      userId: activeUserId,
      taskTitle: `Browse: ${finalTitle}`,
      instruction,
      targetSystem: page.url(),
      status: 'completed',
      steps,
      resultSummary: aiSummary || `Autonomous browsing completed at ${page.url()}`,
      screenshotUrl: screenshotBase64 || undefined,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Browser Agent] Execution error:', error);
    logStep('Execution Error', targetUrl, 'failed', error?.message || 'Navigation failure.');

    res.status(200).json({
      id: executionId,
      userId: activeUserId,
      taskTitle: `Browse: ${targetUrl}`,
      instruction,
      targetSystem: targetUrl,
      status: 'failed',
      steps,
      resultSummary: `Agent encountered an error: ${error?.message || 'Connection timeout'}`,
      errorDetails: error?.stack,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });
  } finally {
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}
