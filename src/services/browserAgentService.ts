import type { ActionExecution, AgentActionStep } from '../types';

export interface ExecuteBrowserTaskParams {
  instruction: string;
  url?: string;
  approved?: boolean;
}

export async function executeBrowserTask(
  params: ExecuteBrowserTaskParams
): Promise<ActionExecution> {
  const response = await fetch('/api/browser/agent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok && !data?.id) {
    throw new Error(data?.error || `Browser agent failed with status ${response.status}`);
  }

  return data as ActionExecution;
}
