import { useEffect, useRef, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  RotateCw,
  Check,
} from "lucide-react";

export type DateFilter =
  | "all"
  | "today"
  | "tomorrow"
  | "week";

interface TopBarProps {
  onRefresh: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
}

export default function TopBar({
  onRefresh,
  searchQuery,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
}: TopBarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setFilterOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const filters: {
    label: string;
    value: DateFilter;
  }[] = [
    {
      label: "All",
      value: "all",
    },
    {
      label: "Today",
      value: "today",
    },
    {
      label: "Tomorrow",
      value: "tomorrow",
    },
    {
      label: "This Week",
      value: "week",
    },
  ];

  const handleFilterChange = (filter: DateFilter) => {
    onDateFilterChange(filter);
    setFilterOpen(false);
  };

  return (
    <div className="flex items-center gap-3 px-6 py-4 border-b border-dashed border-gray-200">
      <div className="flex-1 flex items-center gap-2 rounded-lg bg-gray-100 px-3.5 py-2">
        <Search
          size={15}
          className="text-gray-400 shrink-0"
        />

        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) =>
            onSearchChange(e.target.value)
          }
          className="w-full bg-transparent text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none"
        />
      </div>

      <div
        className="relative"
        ref={filterRef}
      >
        <button
          type="button"
          aria-label="Filter"
          onClick={() =>
            setFilterOpen((prev) => !prev)
          }
          className={`transition-colors p-1.5 ${
            filterOpen || dateFilter !== "all"
              ? "text-emerald-500"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <SlidersHorizontal size={17} />
        </button>

        {filterOpen && (
          <div className="absolute right-0 top-full mt-2 w-40 rounded-lg border border-gray-100 bg-white shadow-lg z-20 py-1">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() =>
                  handleFilterChange(filter.value)
                }
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {filter.label}

                {dateFilter === filter.value && (
                  <Check
                    size={15}
                    className="text-emerald-500"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        aria-label="Refresh"
        onClick={onRefresh}
        className="text-gray-400 hover:text-gray-600 transition-colors p-1.5"
      >
        <RotateCw size={16} />
      </button>
    </div>
  );
}