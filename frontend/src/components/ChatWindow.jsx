import { useCallback, useEffect, useRef, useState } from "react";

const IconButton = ({ label, children, ...props }) => (
  <button
    type="button"
    className="grid h-10 w-10 place-items-center rounded-lg border border-white/7 bg-white/[0.03] text-[#B9B2C8] transition hover:border-[#8B5CF6]/45 hover:bg-[#1A1230] hover:text-white"
    aria-label={label}
    {...props}
  >
    {children}
  </button>
);

const SendIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    aria-hidden="true"
  >
    <path d="m22 2-7 20-4-9-9-4 20-7Z" strokeLinejoin="round" />
    <path d="M22 2 11 13" strokeLinecap="round" />
  </svg>
);

const PaperclipIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    aria-hidden="true"
  >
    <path
      d="m21.4 11.6-8.5 8.5a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.4-8.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const EmojiIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path
      d="M8.5 10h.01M15.5 10h.01M8 14c1 1.4 2.3 2 4 2s3-.6 4-2"
      strokeLinecap="round"
    />
  </svg>
);

const TrashIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    aria-hidden="true"
  >
    <path
      d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FileIcon = ({ category }) => {
  const label =
    category === "pdf"
      ? "PDF"
      : category === "video"
        ? "VID"
        : category === "audio"
          ? "AUD"
          : "DOC";

  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/10 text-[10px] font-bold tracking-wide text-white">
      {label}
    </span>
  );
};

const DownloadIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    aria-hidden="true"
  >
    <path
      d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const formatFileSize = (size = 0) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const AttachmentPreview = ({ attachment, isSent }) => {
  if (!attachment) return null;

  const meta = `${attachment.category?.toUpperCase() || "FILE"} | ${formatFileSize(
    attachment.fileSize,
  )}`;

  if (attachment.category === "image" && attachment.url) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        download={attachment.fileName}
        className="mt-2 block overflow-hidden rounded-lg border border-white/10 bg-black/15"
      >
        <img
          src={attachment.url}
          alt={attachment.fileName}
          className="max-h-64 w-full object-cover"
        />
        <span className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
          <span className="min-w-0 truncate">{attachment.fileName}</span>
          <span className={isSent ? "text-white/70" : "text-[#AFA8BD]"}>
            {formatFileSize(attachment.fileSize)}
          </span>
        </span>
      </a>
    );
  }

  return (
    <div className="mt-2 flex min-w-0 items-center gap-3 rounded-lg border border-white/10 bg-black/15 p-3">
      <FileIcon category={attachment.category} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{attachment.fileName}</p>
        <p
          className={
            isSent ? "text-xs text-white/65" : "text-xs text-[#A39DAE]"
          }
        >
          {meta}
        </p>
      </div>
      {attachment.url && (
        <a
          href={attachment.url}
          target="_blank"
          rel="noreferrer"
          download={attachment.fileName}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/10 transition hover:bg-white/15"
          aria-label={`Download ${attachment.fileName}`}
        >
          <DownloadIcon />
        </a>
      )}
    </div>
  );
};

const ChatWindow = ({
  conversation,
  messages = [],
  contacts = [],
  groupMembers = [],
  groupActionError = "",
  canDeleteGroup = false,
  isDeletingGroup = false,
  isGroupMembersLoading = false,
  isLoading = false,
  error = "",
  onAddGroupMember,
  onDeleteGroup,
  onSendAttachment,
  onSendMessage,
  onTypingChange,
}) => {
  const [draft, setDraft] = useState("");
  const [uploadState, setUploadState] = useState({
    isUploading: false,
    progress: 0,
    error: "",
    fileName: "",
  });
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingStopTimerRef = useRef(null);
  const isTypingActiveRef = useRef(false);

  const onTypingChangeRef = useRef(onTypingChange);
  useEffect(() => {
    onTypingChangeRef.current = onTypingChange;
  }, [onTypingChange]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const prevConversationIdRef = useRef(null);
  useEffect(() => {
    const prevId = prevConversationIdRef.current;
    const nextId = conversation?.id ?? null;

    if (prevId !== null && prevId !== nextId) {
      if (isTypingActiveRef.current) {
        isTypingActiveRef.current = false;
        onTypingChangeRef.current?.(false);
      }
      if (typingStopTimerRef.current) {
        window.clearTimeout(typingStopTimerRef.current);
        typingStopTimerRef.current = null;
      }
    }

    prevConversationIdRef.current = nextId;
  }, [conversation?.id]);

  useEffect(() => {
    return () => {
      if (typingStopTimerRef.current) {
        window.clearTimeout(typingStopTimerRef.current);
      }
      if (isTypingActiveRef.current) {
        isTypingActiveRef.current = false;
        onTypingChangeRef.current?.(false);
      }
    };
  }, []);

  const stopTyping = useCallback(() => {
    if (typingStopTimerRef.current) {
      window.clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
    if (isTypingActiveRef.current) {
      isTypingActiveRef.current = false;
      onTypingChangeRef.current?.(false);
    }
  }, []);

  if (!conversation) return null;
  const isGroup = conversation.type === "group";
  const memberUserIds = new Set(
    groupMembers.map((member) => String(member.user_id)),
  );
  const availableMembers = contacts.filter(
    (contact) => !memberUserIds.has(String(contact.id)),
  );

  const handleSubmit = () => {
    const text = draft.trim();
    if (!text) return;
    stopTyping();
    onSendMessage?.(text);
    setDraft("");
  };

  const handleAttachClick = () => {
    if (uploadState.isUploading) return;
    fileInputRef.current?.click();
  };

  const handleAttachmentChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    stopTyping();
    setUploadState({
      isUploading: true,
      progress: 0,
      error: "",
      fileName: file.name,
    });

    try {
      await onSendAttachment?.(file, (progress) => {
        setUploadState((current) => ({
          ...current,
          progress,
        }));
      });
      setUploadState({
        isUploading: false,
        progress: 0,
        error: "",
        fileName: "",
      });
    } catch (error) {
      setUploadState({
        isUploading: false,
        progress: 0,
        error: error.message || "Unable to upload attachment.",
        fileName: file.name,
      });
    }
  };

  const handleDraftChange = (event) => {
    const nextDraft = event.target.value;
    setDraft(nextDraft);

    if (!nextDraft.trim()) {
      stopTyping();
      return;
    }

    // Start typing — only send once until stopped
    if (!isTypingActiveRef.current) {
      isTypingActiveRef.current = true;
      onTypingChangeRef.current?.(true);
    }

    // Reset the stop timer on every keystroke
    if (typingStopTimerRef.current) {
      window.clearTimeout(typingStopTimerRef.current);
    }

    // Stop typing after 3 seconds of no keystrokes (was 1200ms — too short)
    typingStopTimerRef.current = window.setTimeout(stopTyping, 3000);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleAddMember = () => {
    if (!selectedMemberId) return;
    onAddGroupMember?.(selectedMemberId);
    setSelectedMemberId("");
  };

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-white/8 bg-[#0B0A14]/78 px-5 py-4 backdrop-blur-xl sm:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full ring-1 ring-white/10">
            {conversation.picture ? (
              <img
                className="h-12 w-12 rounded-full object-cover"
                src={conversation.picture}
                alt=""
                referrerPolicy="no-referrer"
              />
            ) : (
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${conversation.accent} text-sm font-bold text-white`}
              >
                {conversation.initials}
              </span>
            )}
            {conversation.isOnline && (
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#0B0A14] bg-[#22C55E]" />
            )}
          </span>

          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-[#F8F5FF]">
              {conversation.name}
            </h2>
            <div className="mt-0.5 flex items-center gap-1.5">
              {conversation.isTyping ? (
                <>
                  {/* Animated typing dots */}
                  <span className="flex items-center gap-[3px]">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6]"
                        style={{
                          animation: "typingBounce 1.2s ease-in-out infinite",
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </span>
                  <p className="truncate text-sm text-[#8B5CF6]">Typing...</p>
                </>
              ) : (
                <p className="truncate text-sm text-[#9F98AF]">
                  {isGroup
                    ? conversation.memberCount
                      ? `${conversation.memberCount} members`
                      : "Group"
                    : conversation.isOnline
                      ? "Online"
                      : "Offline"}
                </p>
              )}
            </div>
          </div>
        </div>

        {isGroup && (
          <div className="hidden min-w-[220px] max-w-md items-center gap-2 sm:flex">
            <select
              value={selectedMemberId}
              onChange={(event) => setSelectedMemberId(event.target.value)}
              className="h-10 min-w-0 flex-1 rounded-lg border border-white/8 bg-[#100E1A] px-3 text-sm text-[#F7F3FF] outline-none focus:border-[#8B5CF6]/70"
              disabled={isGroupMembersLoading}
              aria-label="Select group member"
            >
              <option value="">
                {isGroupMembersLoading ? "Loading..." : "Add member"}
              </option>
              {availableMembers.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name || contact.username || contact.email}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddMember}
              disabled={!selectedMemberId}
              className="h-10 rounded-lg bg-[#7C3AED] px-3 text-sm font-semibold text-white transition hover:bg-[#8B5CF6] disabled:cursor-not-allowed disabled:opacity-45"
            >
              Add
            </button>
            {canDeleteGroup && (
              <button
                type="button"
                onClick={onDeleteGroup}
                disabled={isDeletingGroup}
                className="flex h-10 items-center gap-1.5 rounded-lg border border-red-400/25 bg-red-500/10 px-3 text-sm font-semibold text-red-200 transition hover:border-red-300/45 hover:bg-red-500/18 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <TrashIcon />
                {isDeletingGroup ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        )}
      </header>

      {isGroup && groupActionError && (
        <p className="border-b border-red-500/20 bg-red-500/10 px-5 py-2 text-xs text-red-300 sm:px-7">
          {groupActionError}
        </p>
      )}

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <div className="self-center rounded-full border border-white/7 bg-white/[0.035] px-3 py-1 text-xs font-medium text-[#AFA8BD]">
            Today
          </div>

          {isLoading && (
            <p className="self-center rounded-full border border-white/7 bg-white/[0.035] px-3 py-1 text-xs font-medium text-[#AFA8BD]">
              Loading messages...
            </p>
          )}

          {!isLoading && error && (
            <p className="self-center rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300">
              {error}
            </p>
          )}

          {!isLoading && !error && messages.length === 0 && (
            <p className="self-center rounded-full border border-white/7 bg-white/[0.035] px-3 py-1 text-xs font-medium text-[#AFA8BD]">
              Start the conversation
            </p>
          )}

          {messages.map((message) => {
            const isSent = message.direction === "sent";
            return (
              <div
                key={message.id}
                className={`flex ${isSent ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.2)] ${
                    isSent
                      ? "rounded-br-md bg-gradient-to-br from-[#8B5CF6] to-[#5B21B6] text-white"
                      : "rounded-bl-md border border-white/7 bg-[#12101D] text-[#EEEAF6]"
                  } ${message.pending ? "opacity-70" : "opacity-100"}`}
                >
                  {message.body && (
                    <p className="text-sm leading-6">{message.body}</p>
                  )}
                  <AttachmentPreview
                    attachment={message.attachment}
                    isSent={isSent}
                  />
                  <div className="mt-1 flex items-center justify-end gap-1.5">
                    <p
                      className={`text-[11px] ${
                        isSent ? "text-white/70" : "text-[#8F889E]"
                      }`}
                    >
                      {message.time}
                    </p>
                    {/* Pending indicator for sent messages */}
                    {isSent && message.pending && (
                      <svg
                        className="h-3 w-3 text-white/50"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-label="Sending"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M12 7v5l3 3"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="2"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input footer */}
      <footer className="shrink-0 border-t border-white/8 bg-[#0B0A14]/82 px-5 py-4 backdrop-blur-xl sm:px-7">
        {(uploadState.isUploading || uploadState.error) && (
          <div className="mx-auto mb-3 max-w-3xl rounded-lg border border-white/8 bg-[#100E1A] px-3 py-2">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="min-w-0 truncate text-[#CFC8DC]">
                {uploadState.error || uploadState.fileName}
              </span>
              {uploadState.isUploading && (
                <span className="text-[#AFA8BD]">{uploadState.progress}%</span>
              )}
            </div>
            {uploadState.isUploading && (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-[#8B5CF6] transition-all"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
            )}
          </div>
        )}
        <div className="mx-auto flex max-w-3xl items-end gap-3 rounded-xl border border-white/8 bg-[#100E1A] p-2 shadow-[0_18px_60px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.035)]">
          <IconButton label="Add emoji">
            <EmojiIcon />
          </IconButton>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,video/*,audio/*"
            onChange={handleAttachmentChange}
          />
          <IconButton
            label="Attach file"
            onClick={handleAttachClick}
            disabled={uploadState.isUploading}
          >
            <PaperclipIcon />
          </IconButton>
          <textarea
            value={draft}
            onChange={handleDraftChange}
            onKeyDown={handleKeyDown}
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-6 text-[#F7F3FF] outline-none placeholder:text-[#746D83]"
            placeholder="Type a message..."
            rows={1}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!draft.trim()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#A855F7] to-[#5B5FF6] text-white shadow-[0_12px_28px_rgba(124,58,237,0.38)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(124,58,237,0.48)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </div>
      </footer>

      {/* Typing bounce animation */}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </section>
  );
};

export default ChatWindow;
