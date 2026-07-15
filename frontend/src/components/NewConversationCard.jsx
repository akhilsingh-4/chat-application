const PlusIcon = () => (
  <svg
    className="h-6 w-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    aria-hidden="true"
  >
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </svg>
);

const ArrowIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    aria-hidden="true"
  >
    <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NewConversationCard = ({
  groupName,
  groupDescription,
  isCreating = false,
  error = "",
  onGroupNameChange,
  onGroupDescriptionChange,
  onCreateGroup,
}) => {
  return (
    <form
      className="mt-5 rounded-lg border border-white/7 bg-[#11101A]/78 p-3.5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
      onSubmit={onCreateGroup}
    >
      <div className="mb-3 grid grid-cols-[44px_minmax(0,1fr)] items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br from-[#A855F7] via-[#7C3AED] to-[#3056D3] text-white shadow-[0_12px_30px_rgba(124,58,237,0.38)]">
          <PlusIcon />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-[#F6F2FF]">
            New Group
          </span>
          <span className="mt-1 block truncate text-[13px] text-[#A39DAE]">
            Create a shared chat
          </span>
        </span>
      </div>

      <div className="space-y-2">
        <input
          value={groupName}
          onChange={(event) => onGroupNameChange?.(event.target.value)}
          className="h-10 w-full rounded-lg border border-white/8 bg-[#0F0D19] px-3 text-sm text-[#F7F3FF] outline-none placeholder:text-[#746D83] focus:border-[#8B5CF6]/70"
          placeholder="Group name"
        />
        <input
          value={groupDescription}
          onChange={(event) => onGroupDescriptionChange?.(event.target.value)}
          className="h-10 w-full rounded-lg border border-white/8 bg-[#0F0D19] px-3 text-sm text-[#F7F3FF] outline-none placeholder:text-[#746D83] focus:border-[#8B5CF6]/70"
          placeholder="Description"
        />
      </div>

      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={!groupName.trim() || isCreating}
        className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#7C3AED] px-3 text-sm font-semibold text-white transition hover:bg-[#8B5CF6] disabled:cursor-not-allowed disabled:opacity-45"
      >
        {isCreating ? "Creating..." : "Create Group"}
        <ArrowIcon />
      </button>
    </form>
  );
};

export default NewConversationCard;
