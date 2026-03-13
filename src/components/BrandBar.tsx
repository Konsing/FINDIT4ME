interface BrandBarProps {
  brandName: string;
  productCount: number;
  isLoading: boolean;
}

export default function BrandBar({
  brandName,
  productCount,
  isLoading,
}: BrandBarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#666] uppercase tracking-widest">
          Showing results for
        </span>
        <span className="text-sm font-bold text-white">{brandName}</span>
      </div>
      <span className="text-xs text-[#555]">
        {isLoading ? (
          <span className="animate-pulse">Searching...</span>
        ) : (
          `${productCount} product${productCount !== 1 ? "s" : ""} found`
        )}
      </span>
    </div>
  );
}
