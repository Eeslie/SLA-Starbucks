"use client";
import React, { useState } from "react";
import { useArticles } from "@/lib/data";
import { Search, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DbArticle } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

export default function SelfServicePage() {
  const { articles, refresh, deleteArticle } = useArticles(true); // Show all articles (including drafts) for admin
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<DbArticle | null>(null);
  const [editMode, setEditMode] = useState<'edit' | 'preview'>('edit');

  // New Article State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<'Draft' | 'Published'>('Draft');

  const filtered = articles.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) || 
    (a.tags && a.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
  );

  const handleCreate = async () => {
    const client = supabase;
    if (!client || !title || !content) return;
    
    const newArticle = {
        title,
        category,
        content,
        tags: [],
        status: status, // Use the status state
        helpfulness_score: 0, 
        updated_at: new Date().toISOString()
    };

    if (editing) {
        await client.from('articles').update(newArticle).eq('id', editing.id);
    } else {
        await client.from('articles').insert(newArticle);
    }
    
    setTitle("");
    setContent("");
    setStatus('Draft');
    setEditing(null);
    setEditMode('edit');
    refresh();
  };

  const handleEdit = (a: DbArticle) => {
    setEditing(a);
    setTitle(a.title);
    setCategory(a.category);
    setContent(a.content);
    setStatus(a.status || 'Draft');
  };

  const handleCancel = () => {
      setEditing(null);
      setTitle("");
      setContent("");
      setStatus('Draft');
      setEditMode('edit');
  };

  return (
    <div className="space-y-6">
      <div className="sb-section">
        <h1 className="text-3xl font-bold text-[var(--sb-dark)]">Self-Service Portal</h1>
        <span className="text-sm text-gray-500">Manage knowledge base articles</span>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Editor Pane */}
         <div className="md:col-span-2 sb-card p-6 min-h-[500px] flex flex-col">
             <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                    <Edit size={18} />
                    {editing ? "Edit Article" : "Create New Article"}
                </h2>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setEditMode('edit')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${editMode === 'edit' ? 'bg-white text-[var(--sb-green)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Editor
                    </button>
                    <button 
                        onClick={() => setEditMode('preview')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${editMode === 'preview' ? 'bg-white text-[var(--sb-green)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Preview
                    </button>
                </div>
             </div>

             <div className="space-y-4 flex-1 flex flex-col">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input 
                      className="sb-input text-lg font-bold md:col-span-2" 
                      placeholder="Article Title" 
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                    />
                    <select 
                      className="sb-input"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                    >
                        <option>General</option>
                        <option>Orders</option>
                        <option>Rewards</option>
                        <option>Account</option>
                        <option>App Support</option>
                        <option>Payment</option>
                        <option>Menu</option>
                    </select>
                 </div>
                 
                 <div className="flex items-center gap-4">
                    <label className="text-sm font-semibold text-gray-600">Status:</label>
                    <select 
                      className="sb-input flex-1"
                      value={status}
                      onChange={e => setStatus(e.target.value as 'Draft' | 'Published')}
                    >
                        <option value="Draft">Draft</option>
                        <option value="Published">Published</option>
                    </select>
                    {status === 'Published' && (
                      <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                        ✓ Will appear in customer portal
                      </span>
                    )}
                 </div>

                 {editMode === 'edit' ? (
                     <textarea 
                       className="sb-input flex-1 min-h-[300px] font-mono text-sm leading-relaxed resize-none p-4 whitespace-pre-wrap" 
                       placeholder="Write content here (Markdown supported)...

# Use headers

## Subheadings

**Use bold** for emphasis

- Create lists
- Add spacing with blank lines

---

Use --- for section breaks"
                       value={content}
                       onChange={e => setContent(e.target.value)}
                     />
                 ) : (
                     <div className="sb-input flex-1 min-h-[300px] bg-gray-50/50 overflow-y-auto p-6 prose prose-sm max-w-none prose-headings:text-[var(--sb-dark)] prose-a:text-[var(--sb-green)] prose-strong:text-[var(--sb-dark)] prose-img:rounded-xl prose-p:my-4 prose-headings:my-6 prose-ul:my-4 prose-ol:my-4 prose-li:my-2 shadow-inner border-gray-100">
                        {content ? (
                            <ReactMarkdown 
                              remarkPlugins={[remarkBreaks]}
                              components={{
                                p: ({node, ...props}) => <p className="mb-4" {...props} />,
                                h1: ({node, ...props}) => <h1 className="mb-6 mt-8" {...props} />,
                                h2: ({node, ...props}) => <h2 className="mb-4 mt-6" {...props} />,
                                h3: ({node, ...props}) => <h3 className="mb-3 mt-5" {...props} />,
                                ul: ({node, ...props}) => <ul className="mb-4 ml-6 space-y-2" {...props} />,
                                ol: ({node, ...props}) => <ol className="mb-4 ml-6 space-y-2" {...props} />,
                                li: ({node, ...props}) => <li className="mb-1" {...props} />,
                                hr: ({node, ...props}) => <hr className="my-6 border-gray-300" {...props} />,
                              }}
                            >
                              {content}
                            </ReactMarkdown>
                        ) : (
                            <p className="text-gray-400 italic">No content to preview yet...</p>
                        )}
                     </div>
                 )}

                 <div className="flex gap-2 justify-end pt-4 border-t border-gray-50 mt-auto">
                     {editing && <button className="sb-btn bg-gray-400 hover:bg-gray-500 py-2" onClick={handleCancel}>Cancel</button>}
                     <button className="sb-btn py-2" onClick={handleCreate}>
                         {editing ? "Update Article" : "Publish Article"}
                     </button>
                 </div>
             </div>
         </div>

        {/* Article List Pane */}
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                  className="sb-input pl-10" 
                  placeholder="Search articles..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
            </div>
            
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filtered.map(a => (
                    <div key={a.id} className="sb-card p-4 hover:border-[var(--sb-green)] transition group relative">
                        <div 
                          className="cursor-pointer"
                          onClick={() => handleEdit(a)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-[var(--sb-dark)] group-hover:text-[var(--sb-green)] transition-colors pr-8">
                                    {a.title}
                                </h3>
                                <span className={`flex-shrink-0 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${a.status === 'Published' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                                    {a.status}
                                </span>
                            </div>
                            <div className="text-xs text-gray-500 mb-3 line-clamp-3 prose prose-sm max-w-none prose-p:my-1 prose-headings:my-1 opacity-80">
                                <ReactMarkdown 
                                  remarkPlugins={[remarkBreaks]}
                                  components={{
                                    p: ({node, ...props}) => <p className="mb-1" {...props} />,
                                    h1: ({node, ...props}) => <h1 className="mb-2 mt-2 text-sm font-bold" {...props} />,
                                    h2: ({node, ...props}) => <h2 className="mb-1 mt-2 text-xs font-semibold" {...props} />,
                                    h3: ({node, ...props}) => <h3 className="mb-1 mt-1 text-xs font-semibold" {...props} />,
                                  }}
                                >
                                  {a.content}
                                </ReactMarkdown>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium uppercase tracking-wider pt-3 border-t border-gray-50">
                                <span>{new Date(a.updated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                <span className="group-hover:translate-x-1 transition-transform">Edit →</span>
                            </div>
                        </div>
                        {/* Delete button for all articles */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const articleType = a.status === 'Published' ? 'published' : 'draft';
                            if (confirm(`Are you sure you want to delete this ${articleType} article "${a.title}"? This cannot be undone.`)) {
                              deleteArticle(a.id).catch((err: any) => {
                                alert(`Failed to delete article: ${err?.message || 'Unknown error'}`);
                              });
                            }
                          }}
                          className="absolute top-3 right-3 p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition opacity-0 group-hover:opacity-100"
                          title={`Delete ${a.status === 'Published' ? 'published' : 'draft'} article`}
                        >
                          <Trash2 size={14} />
                        </button>
                    </div>
                ))}
                {filtered.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No articles found.</p>}
            </div>
        </div>
      </div>
    </div>
  );
}
