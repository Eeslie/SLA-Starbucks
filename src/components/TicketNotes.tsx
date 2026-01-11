import React, { useState } from "react";
import { Ticket } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

interface TicketNotesProps {
  ticket: Ticket;
  onAdd: (text: string) => void;
}

export const TicketNotes: React.FC<TicketNotesProps> = ({ ticket, onAdd }) => {
  const [text, setText] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleAdd = async () => {
    if (!text.trim()) {
      setError('Note cannot be empty');
      return;
    }
    
    setIsAdding(true);
    setError(null);
    try {
      await onAdd(text.trim());
      setText("");
      // Success - note will be updated via parent component
    } catch (error: any) {
      console.error('Failed to add note:', error);
      setError(error?.message || 'Failed to add note. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };
  
  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <textarea 
          className="sb-input w-full min-h-[80px] resize-none" 
          placeholder="Add internal note (press Enter to save, Shift+Enter for new line)" 
          value={text} 
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyPress}
          disabled={isAdding}
        />
        <button 
          className="sb-btn shrink-0 self-start" 
          onClick={handleAdd}
          disabled={isAdding || !text.trim()}
        >
          {isAdding ? 'Adding...' : 'Add'}
        </button>
      </div>
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
        {ticket.notes && ticket.notes.length > 0 ? (
          ticket.notes
            .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()) // Sort newest first
            .map((n) => (
            <div key={n.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between mb-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {n.internal !== false ? 'Internal Note' : 'Public Note'}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(n.at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{n.text}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
            <p>No notes yet. Add your first note above.</p>
          </div>
        )}
      </div>
    </div>
  );
};
