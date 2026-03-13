"use client";

import SearchBar from "./SearchBar";

interface HeaderProps {
  onSearch: (query: string) => void;
  onAboutClick: () => void;
}

export default function Header({ onSearch, onAboutClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-5 border-b border-[#222]">
      <h1 className="text-lg font-extrabold tracking-widest text-white">
        FINDIT4ME
      </h1>
      <div className="flex items-center gap-4">
        <SearchBar onSearch={onSearch} />
        <button
          onClick={onAboutClick}
          className="text-xs text-[#888] hover:text-white transition-colors"
        >
          About
        </button>
      </div>
    </header>
  );
}
