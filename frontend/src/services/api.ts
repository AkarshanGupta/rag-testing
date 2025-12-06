const API_BASE_URL = 'https://rag-testing-m7nf.onrender.com';

export const askQuestion = async (question: string) => {
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw { status: response.status, message: error.error || error.detail || 'Failed to get response' };
  }

  return response.json();
};

export const ingestUrl = async (url: string, adminToken: string) => {
  const formData = new FormData();
  formData.append('url', url);

  const response = await fetch(`${API_BASE_URL}/ingest-url`, {
    method: 'POST',
    headers: {
      'x-admin-token': adminToken,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw { status: response.status, message: error.error || error.detail || 'Failed to ingest URL' };
  }

  return response.json();
};

export const ingestFile = async (file: File, adminToken: string) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/ingest-file`, {
    method: 'POST',
    headers: {
      'x-admin-token': adminToken,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw { status: response.status, message: error.error || error.detail || 'Failed to ingest file' };
  }

  return response.json();
};
