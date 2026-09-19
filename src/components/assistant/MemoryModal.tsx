import React, { useState } from "react";
import { X, Brain, Plus, Trash2, Tag, Calendar } from "lucide-react";
import { MemoryItem } from "../../types";

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryItem[];
  onAddMemory: (key: string, value: string, category: "preference" | "routine" | "application" | "user_info" | "website") => void;
  onRemoveMemory: (id: string) => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  isOpen,
  onClose,
  memories,
  onAddMemory,
  onRemoveMemory,
}) => {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newCategory, setNewCategory] = useState<"preference" | "routine" | "application" | "user_info" | "website">("preference");
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;
    onAddMemory(newKey.trim(), newValue.trim(), newCategory);
    setNewKey("");
    setNewValue("");
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 relative max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Long-Term Memory</h3>
              <p className="text-xs text-slate-400">Information & preferences Magic remembers across sessions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Memory Form Toggle */}
        <div className="mt-4 shrink-0">
          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs font-medium text-indigo-300 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Memory</span>
            </button>
          ) : (
            <form onSubmit={handleAddSubmit} className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Key (e.g. Favorite Language)"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="preference">Preference</option>
                  <option value="user_info">User Info</option>
                  <option value="routine">Routine</option>
                  <option value="application">Application</option>
                  <option value="website">Website</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Value (e.g. TypeScript & Tailwind)"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white cursor-pointer"
                >
                  Save Memory
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Memories List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
          {memories.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No memories stored yet. Tell Magic to remember something or add one above!
            </div>
          ) : (
            memories.map((mem) => (
              <div
                key={mem.id}
                className="flex items-start justify-between p-3 rounded-xl bg-slate-850/60 border border-slate-800 hover:border-slate-750 transition-colors group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200">{mem.key}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Tag className="w-2.5 h-2.5" />
                      {mem.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{mem.value}</p>
                </div>
                <button
                  onClick={() => onRemoveMemory(mem.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-80 group-hover:opacity-100 cursor-pointer"
                  title="Delete memory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
