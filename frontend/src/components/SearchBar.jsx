const SearchIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    aria-hidden="true"
  >
    <path d="m21 21-4.35-4.35" strokeLinecap="round" />
    <circle cx="11" cy="11" r="7" />
  </svg>
);

const SearchBar = ({ placeholder = "Search people or messages..." }) => {
  return (
    <label className="group flex h-14 items-center gap-3 rounded-lg border border-white/8 bg-[#0F0D19]/80 px-4 text-[#9C98A8] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition focus-within:border-[#8B5CF6]/70 focus-within:bg-[#12101F] focus-within:text-[#D8D2FF]">
      <SearchIcon />
      <input
        className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#F4F1FA] outline-none placeholder:text-[#817D8F]"
        type="search"
        placeholder={placeholder}
        aria-label={placeholder}
      />
      <kbd className="hidden rounded-md border border-white/8 bg-white/[0.03] px-2 py-1 text-[11px] font-semibold text-[#A7A1B8] sm:inline-flex">
        Ctrl K
      </kbd>
    </label>
  );
};

export default SearchBar;
