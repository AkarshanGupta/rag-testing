export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  sources?: string[];
  timestamp: Date;
}

export interface ApiResponse {
  answer: string;
  source_documents: string[];
}

export interface ErrorResponse {
  error?: string;
  detail?: string;
}
