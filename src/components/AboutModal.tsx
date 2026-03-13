"use client";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="bg-[#111] border border-[#333] rounded-lg max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">About FINDIT4ME</h2>
          <button
            onClick={onClose}
            className="text-[#666] hover:text-white transition-colors text-xl"
          >
            &times;
          </button>
        </div>
        <div className="space-y-3 text-sm text-[#aaa]">
          <p>
            FINDIT4ME aggregates merchandise and products from multiple online
            retailers into one place. Search for any brand, franchise, or product
            line to see what&apos;s available across the web.
          </p>
          <p>
            Click any product to visit the retailer&apos;s page directly. We
            don&apos;t sell anything — we just help you find it.
          </p>
          <p className="text-xs text-[#666]">
            Prices and availability are approximate and may differ on the
            retailer&apos;s site. Product data is refreshed periodically.
          </p>
        </div>
      </div>
    </div>
  );
}
