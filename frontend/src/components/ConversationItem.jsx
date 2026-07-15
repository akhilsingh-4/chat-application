const ConversationItem = ({ conversation, active = false, onSelect }) => {
  const {
    name,
    initials,
    message,
    time,
    unread,
    accent,
    picture,
    isOnline,
    isTyping,
    type,
    memberCount,
  } = conversation;
  const isGroup = type === "group";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(conversation)}
      className={`group relative grid w-full grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border px-3.5 py-3.5 text-left transition duration-200 ${
        active
          ? "border-[#7C3AED]/50 bg-[#1A1130]/80 shadow-[0_16px_44px_rgba(88,28,135,0.22),inset_0_1px_0_rgba(255,255,255,0.05)]"
          : "border-transparent bg-[#11101A]/68 hover:border-white/8 hover:bg-[#151320]"
      }`}
      aria-pressed={active}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-10 w-0.5 -translate-y-1/2 rounded-full bg-[#9D4EDD]" />
      )}

      <span className="relative flex h-12 w-12 items-center justify-center rounded-full ring-1 ring-white/10">
        {isGroup ? (
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${accent} text-white`}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M16 11a4 4 0 1 0-8 0" strokeLinecap="round" />
              <path d="M4 19a8 8 0 0 1 16 0" strokeLinecap="round" />
              <path
                d="M19 9a3 3 0 0 1 2 2.8M3 11.8A3 3 0 0 1 5 9"
                strokeLinecap="round"
              />
            </svg>
          </span>
        ) : picture ? (
          <img
            className="h-12 w-12 rounded-full object-cover"
            src={picture}
            alt=""
            referrerPolicy="no-referrer"
          />
        ) : (
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${accent} text-sm font-bold text-white`}
          >
            {initials}
          </span>
        )}
        {isOnline && (
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#11101A] bg-[#22C55E]" />
        )}
      </span>

      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-[#F6F2FF]">
          {name}
        </span>
        <span className="mt-1 block truncate text-[13px] leading-5 text-[#A39DAE]">
          {isGroup && memberCount
            ? `${memberCount} members`
            : isTyping
              ? "Typing..."
              : message}
        </span>
      </span>

      <span className="flex min-w-[48px] flex-col items-end gap-2">
        <span className="text-xs font-medium text-[#A09AAD]">{time}</span>
        {unread > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gradient-to-br from-[#A855F7] to-[#6D5DFB] px-1.5 text-[11px] font-bold text-white shadow-[0_8px_20px_rgba(124,58,237,0.45)]">
            {unread}
          </span>
        )}
      </span>
    </button>
  );
};

export default ConversationItem;
