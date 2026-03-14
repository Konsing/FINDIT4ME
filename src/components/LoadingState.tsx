export default function LoadingState() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0.5 px-6 lg:px-16 xl:px-24 py-2 flex-1">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i}>
          <div className="bg-[#1a1a1a] aspect-square animate-pulse" />
          <div className="px-1 py-2.5 space-y-2">
            <div className="h-3.5 bg-[#1a1a1a] rounded animate-pulse w-3/4" />
            <div className="h-3 bg-[#1a1a1a] rounded animate-pulse w-1/2" />
            <div className="h-2.5 bg-[#1a1a1a] rounded animate-pulse w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
