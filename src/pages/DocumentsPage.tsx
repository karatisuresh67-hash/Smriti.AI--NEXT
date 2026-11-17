import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Eye, 
  Sparkles, 
  CheckSquare, 
  Brain, 
  Clock, 
  Search, 
  X, 
  ArrowRight,
  FileCode,
  FileSpreadsheet,
  FileImage,
  Loader2,
  Check,
  Plus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { processDocumentApi } from '../services/apiService';
import type { DocumentItem } from '../types';

export function DocumentsPage() {
  const { 
    documents, 
    addDocument, 
    deleteDocument, 
    addTask, 
    addMemory, 
    setCurrentTab, 
    setChatMessages, 
    addToast 
  } = useApp();

  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'tasks' | 'memories' | 'raw'>('summary');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsProcessing(true);
    addToast(`Uploading & analyzing ${file.name} with Gemini AI...`, 'info');

    try {
      // Read file as base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const res = reader.result as string;
          // strip data:mime;base64, prefix
          const base64 = res.includes(',') ? res.split(',')[1] : res;
          resolve(base64);
        };
        reader.onerror = reject;
      });

      reader.readAsDataURL(file);
      const fileData = await base64Promise;

      const response = await processDocumentApi({
        fileName: file.name,
        fileData,
        mimeType: file.type || 'application/octet-stream',
      });

      if (response.success && response.result) {
        const newDoc: DocumentItem = {
          id: `doc-${Date.now()}`,
          name: file.name,
          size: file.size,
          mimeType: file.type || 'text/plain',
          extractedText: response.result.extractedText || '',
          summary: response.result.summary || '',
          keyTakeaways: response.result.keyTakeaways || [],
          suggestedTasks: response.result.suggestedTasks || [],
          suggestedMemories: response.result.suggestedMemories || [],
          uploadedAt: new Date().toISOString(),
        };

        addDocument(newDoc);
        setSelectedDoc(newDoc);
        addToast(`Successfully analyzed "${file.name}"!`, 'success');
      } else {
        throw new Error('Analysis completed without results.');
      }
    } catch (err: any) {
      console.error('[DocumentsPage] Upload/Processing error:', err);
      addToast(`Failed to analyze document: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const getFileIcon = (name: string, mime: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-rose-400" />;
    if (ext === 'docx' || ext === 'doc') return <FileText className="w-5 h-5 text-blue-400" />;
    if (ext === 'csv' || ext === 'xlsx') return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (mime.startsWith('image/')) return <FileImage className="w-5 h-5 text-purple-400" />;
    return <FileCode className="w-5 h-5 text-cyan-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredDocs = documents.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.summary && d.summary.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddSuggestedTask = (task: { title: string; priority: string }) => {
    addTask({
      title: task.title,
      description: `Extracted from document: "${selectedDoc?.name || 'Uploaded document'}"`,
      priority: (task.priority === 'High' || task.priority === 'Low') ? task.priority : 'Medium',
      category: 'Work',
      source: 'document',
    });
    addToast(`Added task: "${task.title}"`, 'success');
  };

  const handleAddSuggestedMemory = (mem: { title: string; content: string }) => {
    addMemory({
      title: mem.title,
      content: mem.content,
      category: 'Project',
    });
    addToast(`Saved to memory: "${mem.title}"`, 'success');
  };

  const handleAskAboutDoc = () => {
    if (!selectedDoc) return;
    const prompt = `I have a question about the document "${selectedDoc.name}".\nSummary: ${selectedDoc.summary || ''}\n\nContents:\n${selectedDoc.extractedText.slice(0, 3000)}`;
    setChatMessages(prev => [
      ...prev,
      {
        id: `user-doc-${Date.now()}`,
        role: 'user',
        content: `I'd like to analyze my document "${selectedDoc.name}". Can you help me review its details?`,
        timestamp: new Date().toISOString(),
      }
    ]);
    setSelectedDoc(null);
    setCurrentTab('chat');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <span>Document Intelligence</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload PDFs, DOCX, CSV, and text files. Smriti AI extracts knowledge, creates tasks, and updates your memory.
          </p>
        </div>

        {/* Upload Trigger Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,.csv,.json,.md,image/*"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.45)] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Processing Document...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload Document</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
          dragOver 
            ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_25px_rgba(6,182,212,0.2)]' 
            : 'border-[#1E2540] bg-[#070C1E]/60 hover:border-indigo-500/40 hover:bg-[#0B1024]'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center mb-3">
          <Upload className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-white">
          Drop your document here, or <span className="text-cyan-400 underline">browse files</span>
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Supports PDF, Word (.docx), Plain Text (.txt, .md), Spreadsheets (.csv), and images
        </p>
      </div>

      {/* Filter / Search Bar */}
      {documents.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by name or content..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B1024] border border-[#1E2540] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      )}

      {/* Document Grid or Empty State */}
      {documents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#070C1E] border border-[#1E2540] space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#0D142E] border border-[#1E2540] flex items-center justify-center text-slate-500 mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">No documents analyzed yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            When you upload project briefs, meeting notes, invoices, or research papers, Smriti AI extracts action items, creates memories, and stores knowledge here.
          </p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[#070C1E] border border-[#1E2540] text-slate-400 text-sm">
          No documents matching "{searchQuery}"
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-2xl bg-[#0B1024] border border-[#1E2540] hover:border-cyan-500/30 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <div className="p-2 rounded-xl bg-[#070C1E] border border-[#1E2540] flex-shrink-0">
                      {getFileIcon(doc.name, doc.mimeType)}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-sm font-bold text-white truncate" title={doc.name}>
                        {doc.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      deleteDocument(doc.id);
                      addToast(`Deleted document "${doc.name}"`, 'info');
                    }}
                    title="Delete document"
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {doc.summary ? (
                  <p className="text-xs text-slate-300 line-clamp-3 mt-2 bg-[#070C1E] p-2.5 rounded-xl border border-[#1A223D]">
                    {doc.summary}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 italic mt-2">
                    Analysis complete. Click to review insights.
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#1E2540] flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  {doc.suggestedTasks && doc.suggestedTasks.length > 0 && (
                    <span className="flex items-center gap-1 text-cyan-400 font-medium">
                      <CheckSquare className="w-3 h-3" />
                      {doc.suggestedTasks.length} tasks
                    </span>
                  )}
                  {doc.suggestedMemories && doc.suggestedMemories.length > 0 && (
                    <span className="flex items-center gap-1 text-violet-400 font-medium">
                      <Brain className="w-3 h-3" />
                      {doc.suggestedMemories.length} memories
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setSelectedDoc(doc)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Intelligence Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-3xl max-h-[85vh] bg-[#070C1E] border border-[#1E2540] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#1E2540] flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="p-2.5 rounded-xl bg-[#0D142E] border border-[#1E2540]">
                  {getFileIcon(selectedDoc.name, selectedDoc.mimeType)}
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-base font-bold text-white truncate">
                    {selectedDoc.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {formatFileSize(selectedDoc.size)} • Analyzed on {new Date(selectedDoc.uploadedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleAskAboutDoc}
                  className="px-3 py-1.5 rounded-xl bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 border border-violet-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ask AI</span>
                </button>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#151D36] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Nav Tabs */}
            <div className="px-5 border-b border-[#1E2540] flex space-x-4 bg-[#0B1024]">
              <button
                onClick={() => setActiveTab('summary')}
                className={`py-3 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'summary'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Summary & Key Takeaways
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'tasks'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <span>Suggested Tasks</span>
                {selectedDoc.suggestedTasks && selectedDoc.suggestedTasks.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[10px]">
                    {selectedDoc.suggestedTasks.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('memories')}
                className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'memories'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <span>Suggested Memories</span>
                {selectedDoc.suggestedMemories && selectedDoc.suggestedMemories.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 text-[10px]">
                    {selectedDoc.suggestedMemories.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                className={`py-3 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'raw'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Extracted Text
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Executive Summary
                    </h4>
                    <p className="text-sm text-slate-200 bg-[#0B1024] p-4 rounded-xl border border-[#1E2540] leading-relaxed">
                      {selectedDoc.summary || 'No summary available.'}
                    </p>
                  </div>

                  {selectedDoc.keyTakeaways && selectedDoc.keyTakeaways.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Key Takeaways
                      </h4>
                      <ul className="space-y-2">
                        {selectedDoc.keyTakeaways.map((point, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2.5 text-xs text-slate-300 bg-[#0B1024] p-3 rounded-xl border border-[#1E2540]"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Smriti AI identified these actionable items in the document. Add them to your task board with one click:
                  </p>
                  {selectedDoc.suggestedTasks && selectedDoc.suggestedTasks.length > 0 ? (
                    selectedDoc.suggestedTasks.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-[#0B1024] border border-[#1E2540] flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">{t.title}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1 inline-block ${
                            t.priority === 'High' 
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}>
                            {t.priority} Priority
                          </span>
                        </div>
                        <button
                          onClick={() => handleAddSuggestedTask(t)}
                          className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Task</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic p-4 text-center">
                      No explicit tasks detected in this document.
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'memories' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Important facts or notes identified for long-term memory:
                  </p>
                  {selectedDoc.suggestedMemories && selectedDoc.suggestedMemories.length > 0 ? (
                    selectedDoc.suggestedMemories.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-[#0B1024] border border-[#1E2540] flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">{m.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{m.content}</p>
                        </div>
                        <button
                          onClick={() => handleAddSuggestedMemory(m)}
                          className="px-3 py-1.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Save Memory</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic p-4 text-center">
                      No permanent memory facts found.
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'raw' && (
                <div>
                  <pre className="text-xs text-slate-300 bg-[#0B1024] p-4 rounded-xl border border-[#1E2540] overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-96">
                    {selectedDoc.extractedText || 'No raw text extracted.'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
