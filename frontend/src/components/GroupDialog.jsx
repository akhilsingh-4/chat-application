const CloseIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    aria-hidden="true"
  >
    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
  </svg>
);

const GroupDialog = ({
  open = false,
  contacts = [],
  groupName,
  groupDescription,
  selectedMemberIds = [],
  isCreating = false,
  error = "",
  onClose,
  onGroupNameChange,
  onGroupDescriptionChange,
  onToggleMember,
  onCreateGroup,
}) => {
  if (!open) return null;

  const selectedMembers = new Set(selectedMemberIds.map(String));

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/62 px-4 py-6 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <form
        className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0E0C18] shadow-[0_28px_90px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-group-title"
        onSubmit={onCreateGroup}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 py-4">
          <div className="min-w-0">
            <h2 id="new-group-title" className="text-base font-semibold text-[#F8F5FF]">
              New Group
            </h2>
            <p className="mt-1 text-sm text-[#9F98AF]">
              Start a shared conversation
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-lg border border-white/8 text-[#B8B0C8] transition hover:border-white/14 hover:bg-white/[0.05] hover:text-white"
            aria-label="Close group dialog"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#AFA8BD]">
              Group Name
            </span>
            <input
              value={groupName}
              onChange={(event) => onGroupNameChange?.(event.target.value)}
              className="h-11 w-full rounded-lg border border-white/8 bg-[#100E1A] px-3 text-sm text-[#F7F3FF] outline-none placeholder:text-[#746D83] focus:border-[#8B5CF6]/70"
              placeholder="Project team"
              autoFocus
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#AFA8BD]">
              Description
            </span>
            <textarea
              value={groupDescription}
              onChange={(event) =>
                onGroupDescriptionChange?.(event.target.value)
              }
              className="min-h-20 w-full resize-none rounded-lg border border-white/8 bg-[#100E1A] px-3 py-2.5 text-sm leading-6 text-[#F7F3FF] outline-none placeholder:text-[#746D83] focus:border-[#8B5CF6]/70"
              placeholder="What is this group for?"
            />
          </label>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#AFA8BD]">
                Members
              </span>
              <span className="text-xs text-[#8F889E]">
                {selectedMembers.size} selected
              </span>
            </div>

            <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-white/8 bg-[#100E1A]/70 p-2">
              {contacts.length === 0 ? (
                <p className="px-2 py-3 text-sm text-[#9F98AF]">
                  No contacts available
                </p>
              ) : (
                contacts.map((contact) => {
                  const contactId = String(contact.id);
                  const name =
                    contact.name || contact.username || contact.email || "User";
                  const checked = selectedMembers.has(contactId);

                  return (
                    <label
                      key={contactId}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2.5 transition hover:bg-white/[0.04]"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleMember?.(contactId)}
                        className="h-4 w-4 accent-[#8B5CF6]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-[#F6F2FF]">
                          {name}
                        </span>
                        {contact.email && (
                          <span className="mt-0.5 block truncate text-xs text-[#8F889E]">
                            {contact.email}
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-white/8 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-white/8 px-4 text-sm font-semibold text-[#C8C1D6] transition hover:border-white/14 hover:bg-white/[0.04] hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!groupName.trim() || isCreating}
            className="h-10 rounded-lg bg-[#7C3AED] px-4 text-sm font-semibold text-white transition hover:bg-[#8B5CF6] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isCreating ? "Creating..." : "Create Group"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GroupDialog;
