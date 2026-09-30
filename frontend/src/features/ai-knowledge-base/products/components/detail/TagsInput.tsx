'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagsInput({ value, onChange, placeholder = 'Agregar término' }: TagsInputProps) {
  const [draft, setDraft] = useState('');

  const addTag = () => {
    const tag = draft.trim();
    if (tag.length === 0 || value.includes(tag)) {
      setDraft('');
      return;
    }
    onChange([...value, tag]);
    setDraft('');
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {value.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
        >
          {tag}
          <button
            type="button"
            aria-label={`Quitar ${tag}`}
            onClick={() => onChange(value.filter((item) => item !== tag))}
            className="rounded-full p-0.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}
      <div className="flex items-center gap-1.5 rounded-full border border-dashed border-gray-300 px-3 py-1 transition-colors focus-within:border-blue-400">
        <Plus className="h-3.5 w-3.5 shrink-0 text-blue-600" />
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addTag();
            }
          }}
          onBlur={addTag}
          placeholder={placeholder}
          className="w-36 bg-transparent text-sm text-gray-900 outline-none placeholder:text-blue-600"
        />
      </div>
    </div>
  );
}
