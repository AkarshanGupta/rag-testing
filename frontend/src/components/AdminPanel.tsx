import { useState } from 'react';
import { Lock, Upload, Link2, FileText, ArrowLeft, LogOut, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { ingestUrl, ingestFile } from '../services/api';

interface AdminPanelProps {
  onBackClick: () => void;
}

export default function AdminPanel({ onBackClick }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('adminToken'));
  const [tokenInput, setTokenInput] = useState('');
  const [url, setUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [urlMessage, setUrlMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fileMessage, setFileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      localStorage.setItem('adminToken', tokenInput.trim());
      setIsAuthenticated(true);
      setTokenInput('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setUrl('');
    setSelectedFile(null);
    setUrlMessage(null);
    setFileMessage(null);
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) return;

    setUrlLoading(true);
    setUrlMessage(null);

    try {
      await ingestUrl(url.trim(), adminToken);
      setUrlMessage({ type: 'success', text: 'URL ingested successfully!' });
      setUrl('');
    } catch (err: any) {
      if (err.status === 403) {
        setUrlMessage({ type: 'error', text: 'Invalid admin token. Please log out and try again.' });
      } else {
        setUrlMessage({ type: 'error', text: err.message || 'Failed to ingest URL' });
      }
    } finally {
      setUrlLoading(false);
    }
  };

  const handleFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) return;

    setFileLoading(true);
    setFileMessage(null);

    try {
      await ingestFile(selectedFile, adminToken);
      setFileMessage({ type: 'success', text: 'File uploaded successfully!' });
      setSelectedFile(null);
    } catch (err: any) {
      if (err.status === 403) {
        setFileMessage({ type: 'error', text: 'Invalid admin token. Please log out and try again.' });
      } else {
        setFileMessage({ type: 'error', text: err.message || 'Failed to upload file' });
      }
    } finally {
      setFileLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'application/pdf' || file.type === 'text/plain')) {
      setSelectedFile(file);
      setFileMessage(null);
    } else {
      setFileMessage({ type: 'error', text: 'Please select a PDF or TXT file' });
      e.target.value = '';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <button
            onClick={onBackClick}
            className="flex items-center gap-2 text-gray-300 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Chat
          </button>
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Admin Access</h2>
            <p className="text-gray-600 text-center mb-6">Enter your admin token to continue</p>
            <form onSubmit={handleLogin}>
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter admin token"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
                autoFocus
              />
              <button
                type="submit"
                disabled={!tokenInput.trim()}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Access Admin Panel
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-red-400" />
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onBackClick}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Link2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">URL Uploader</h2>
                <p className="text-sm text-gray-500">Ingest recipes from URLs</p>
              </div>
            </div>

            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipe URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/recipe"
                  disabled={urlLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              {urlMessage && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    urlMessage.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {urlMessage.type === 'success' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  <span className="text-sm">{urlMessage.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!url.trim() || urlLoading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
              >
                {urlLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Ingesting...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Ingest URL
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">File Uploader</h2>
                <p className="text-sm text-gray-500">Upload PDF or TXT files</p>
              </div>
            </div>

            <form onSubmit={handleFileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File
                </label>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileChange}
                  disabled={fileLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>

              {fileMessage && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    fileMessage.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {fileMessage.type === 'success' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  <span className="text-sm">{fileMessage.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedFile || fileLoading}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
              >
                {fileLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload File
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-3">Usage Guidelines</h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Use the URL uploader to ingest recipes from websites</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">•</span>
              <span>Upload PDF or TXT files containing recipe information</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">•</span>
              <span>All uploads are processed and made available to users immediately</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">•</span>
              <span>Ensure content is relevant and properly formatted for best results</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
