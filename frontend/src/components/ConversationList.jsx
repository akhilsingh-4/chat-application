import ConversationItem from "./ConversationItem";

const FilterIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    aria-hidden="true"
  >
    <path d="M4 7h16M7 12h10M10 17h4" strokeLinecap="round" />
  </svg>
);

const PlusIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </svg>
);

const ConversationList = ({
  conversations = [],
  selectedConversationId,
  onSelectConversation,
  onCreateGroup,
}) => {
  return (
    <section className="mt-5 flex min-h-0 flex-1 flex-col" aria-labelledby="recent-heading">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <h2
          id="recent-heading"
          className="text-sm font-semibold tracking-wide text-[#D7D1E2]"
        >
          Recent Conversations
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCreateGroup}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-[#8B5CF6]/35 bg-[#7C3AED]/15 px-2.5 text-xs font-semibold text-[#E9DDFF] transition hover:border-[#8B5CF6]/65 hover:bg-[#7C3AED]/25 hover:text-white"
            aria-label="Create new group"
          >
            <PlusIcon />
            New Group
          </button>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-lg border border-transparent text-[#A8A2B5] transition hover:border-white/8 hover:bg-white/[0.04] hover:text-white"
            aria-label="Filter conversations"
          >
            <FilterIcon />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            active={conversation.id === selectedConversationId}
            onSelect={onSelectConversation}
          />
        ))}
      </div>
    </section>
  );
};

export default ConversationList;
