"use client";

import SearchBar from "./SearchBar";

interface HeaderProps {
  onSearch: (query: string) => void;
  onAboutClick: () => void;
}

export default function Header({ onSearch, onAboutClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 lg:px-16 xl:px-24 py-2 border-b border-[#222] bg-black">
      <img
        src="/FINDIT4ME.png"
        alt="FINDIT4ME"
        className="h-14 w-auto block"
      />
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
