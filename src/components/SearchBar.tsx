"use client";

import { useState, useEffect, useCallback } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    onSearch(query);
  }, [query, onSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && query.length >= 2) {
        onSearch(query);
      }
    },
    [query, onSearch]
  );

  return (
    <div className="relative">
      <svg
        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Filter products..."
        className="bg-[#1a1a1a] border border-[#333] rounded-full pl-10 pr-5 py-2 text-sm text-white placeholder-[#666] w-[200px] md:w-[280px] focus:outline-none focus:border-[#555] transition-colors"
      />
    </div>
  );
}
