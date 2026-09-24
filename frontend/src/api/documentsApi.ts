import axios from 'axios';
import type { DocumentDetail, DocumentSummary } from '../types/document';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const client = axios.create({
  baseURL: `${API_URL}/api/documents`,
});

// Automatically attach the logged-in user's JWT to every request.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('syncdoc-token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export async function listDocuments(): Promise<DocumentSummary[]> {
  const { data } = await client.get<DocumentSummary[]>('/');
  return data;
}

export async function getDocument(id: string): Promise<DocumentDetail> {
  const { data } = await client.get<DocumentDetail>(`/${id}`);
  return data;
}

export async function createDocument(
  title: string
): Promise<DocumentDetail> {
  const { data } = await client.post<DocumentDetail>('/', { title });
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  await client.delete(`/${id}`);
}

export type ExportFormat = 'markdown' | 'html' | 'pdf';

/**
 * Week 3 "Transformation Engine" client: downloads the exported file by
 * fetching it as a blob and triggering a browser download.
 */
export async function exportDocument(
  id: string,
  title: string,
  format: ExportFormat
): Promise<void> {
  const response = await client.get(
    `/${id}/export/${format}`,
    { responseType: 'blob' }
  );

  const extension =
    format === 'markdown' ? 'md' : format;

  const filename =
    `${title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'document'}.${extension}`;

  const url = URL.createObjectURL(
    response.data as Blob
  );

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
  
}
export async function addCollaborator(
  documentId: string,
  email: string
): Promise<{
  message: string;
  collaborator: {
    id: string;
    name: string;
    email: string;
  };
}> {
  const { data } = await client.post(
    `/${documentId}/collaborators`,
    { email }
  );

  return data;
}