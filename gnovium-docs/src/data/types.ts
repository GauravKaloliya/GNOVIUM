export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface Endpoint {
  id: string;
  module: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  headers?: Record<string, string>;
  parameters?: Parameter[];
  requestBody?: string;
  response: string;
}
