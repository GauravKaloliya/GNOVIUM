import type { Endpoint } from '../types';
import { itemEnvelope, j, authHeader, workspaceId } from '../common';

export const aiEndpoints: Endpoint[] = [
  {
    id: 'ai-query',
    module: 'AI',
    method: 'POST',
    path: '/ai/query',
    summary: 'Ask workspace AI',
    description: 'Submits a natural language question about your workspace. The API retrieves relevant context via semantic search, assembles it as context, and asks the configured LLM (Ollama locally, cloud provider in production) to answer based on your knowledge. Returns both the answer and source documents.',
    headers: authHeader,
    requestBody: j({
      workspace_id: workspaceId,
      question: 'Summarize authentication mechanisms',
      limit: 5,
    }),
    response: itemEnvelope({
      answer: 'Gnovium uses JWT access and refresh tokens with server-side session revocation. Access tokens expire after 30 minutes, refresh tokens after 14 days.',
      sources: [
        { id: 'fa82a0b1-12c8-47fb-ba2e-ff6a39226cb3', title: 'Research Notes', content: 'Authentication is set up with JWT...', score: 0.95 },
      ],
    }),
  },
];
