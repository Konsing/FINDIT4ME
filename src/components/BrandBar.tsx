import SortDropdown from "./SortDropdown";
import type { SortOption } from "./SortDropdown";

interface BrandBarProps {
  brandName: string;
  productCount: number;
  isLoading: boolean;
  filterQuery?: string;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
}

export default function BrandBar({
  brandName,
  productCount,
  filterQuery,
  sortOption,
  onSortChange,
}: BrandBarProps) {
  return (
    <div className="flex items-center justify-between px-6 lg:px-16 xl:px-24 py-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#666] uppercase tracking-widest">
          {filterQuery ? "Filtering" : "Showing results for"}
        </span>
        <span className="text-sm font-bold text-white">
          {filterQuery ? `"${filterQuery}"` : brandName}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#555]">
          {`${productCount} product${productCount !== 1 ? "s" : ""}`}
        </span>
        <SortDropdown value={sortOption} onChange={onSortChange} />
      </div>
    </div>
  );
}
