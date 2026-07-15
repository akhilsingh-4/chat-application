import { createSlice } from "@reduxjs/toolkit";

const accentClasses = [
  "from-[#F59E0B] via-[#B45309] to-[#451A03]",
  "from-[#F9A8D4] via-[#DB2777] to-[#831843]",
  "from-[#34D399] via-[#059669] to-[#064E3B]",
  "from-[#60A5FA] via-[#2563EB] to-[#1E3A8A]",
];

const initialsFromName = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";

const formatTime = (value) =>
  new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(value ? new Date(value) : new Date());

const messagePreview = ({ text, content, attachment } = {}) =>
  text || content || attachment?.file_name || "Attachment";

const userToConversation = (user, index) => {
  const name = user.name || user.username || user.email || "Unknown user";

  return {
    id: String(user.id),
    name,
    email: user.email || "",
    picture: user.profile_picture || user.picture || "",
    initials: initialsFromName(name),
    message: "Start a conversation",
    time: "",
    unread: 0,
    accent: accentClasses[index % accentClasses.length],
  };
};

const groupToConversation = (group, index) => ({
  id: `group:${group.id}`,
  groupId: String(group.id),
  type: "group",
  name: group.name || "Group chat",
  email: group.description || "Group",
  createdBy: group.created_by ? String(group.created_by) : null,
  picture: "",
  initials: initialsFromName(group.name || "Group"),
  message: "Open group chat",
  time: "",
  unread: 0,
  accent: accentClasses[(index + 2) % accentClasses.length],
  memberCount: group.memberCount || null,
});

const upsertConversation = (state, userId) => {
  let conversation = state.conversations.find(
    (item) => item.id === String(userId),
  );

  if (!conversation) {
    conversation = userToConversation(
      { id: userId },
      state.conversations.length,
    );
    state.conversations.unshift(conversation);
  }

  return conversation;
};

const initialState = {
  activeConversationId: null,
  conversations: [],
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setContacts: (state, action) => {
      const { users = [], currentUserId } = action.payload || {};
      const existingById = new Map(
        state.conversations.map((conversation) => [
          conversation.id,
          conversation,
        ]),
      );

      state.conversations = users
        .filter((user) => String(user.id) !== String(currentUserId))
        .map((user, index) => {
          const next = userToConversation(user, index);
          const existing = existingById.get(next.id);

          return existing
            ? {
                ...existing,
                ...next,
                message: existing.message,
                time: existing.time,
                unread: existing.unread,
                isOnline: Boolean(existing.isOnline),
                isTyping: Boolean(existing.isTyping),
              }
            : next;
        });

      if (
        state.activeConversationId &&
        !state.conversations.some(
          (conversation) => conversation.id === state.activeConversationId,
        )
      ) {
        state.activeConversationId = null;
      }
    },
    setGroups: (state, action) => {
      const { groups = [] } = action.payload || {};
      const personalConversations = state.conversations.filter(
        (conversation) => conversation.type !== "group",
      );
      const existingById = new Map(
        state.conversations.map((conversation) => [
          conversation.id,
          conversation,
        ]),
      );

      const groupConversations = groups.map((group, index) => {
        const next = groupToConversation(group, index);
        const existing = existingById.get(next.id);

        return existing
          ? {
              ...existing,
              ...next,
              message: existing.message,
              time: existing.time,
              unread: existing.unread,
            }
          : next;
      });

      state.conversations = [...personalConversations, ...groupConversations];
    },
    selectConversation: (state, action) => {
      const conversationId = String(action.payload);
      state.activeConversationId = conversationId;

      const conversation = state.conversations.find(
        (item) => item.id === conversationId,
      );
      if (conversation) conversation.unread = 0;
    },
    removeConversation: (state, action) => {
      const conversationId = String(action.payload);
      state.conversations = state.conversations.filter(
        (conversation) => conversation.id !== conversationId,
      );
      if (state.activeConversationId === conversationId) {
        state.activeConversationId = null;
      }
    },
    messageSent: (state, action) => {
      const { receiverId, text, attachment } = action.payload || {};
      const preview = messagePreview({ text, attachment });
      if (!receiverId || !preview?.trim()) return;

      const conversation = upsertConversation(state, receiverId);
      conversation.message = preview.trim();
      conversation.time = formatTime();
    },
    messageReceived: (state, action) => {
      const {
        currentUserId,
        receiver_id,
        sender_id,
        text,
        content,
        attachment,
        created_at,
      } = action.payload || {};
      const preview = messagePreview({ text, content, attachment });
      if (!sender_id || !preview) return;

      const conversationId =
        String(sender_id) === String(currentUserId) ? receiver_id : sender_id;
      const conversation = upsertConversation(state, conversationId);
      conversation.message = preview;
      conversation.time = formatTime(created_at);

      if (
        String(sender_id) !== String(currentUserId) &&
        state.activeConversationId !== String(conversationId)
      ) {
        conversation.unread = (conversation.unread || 0) + 1;
      }
    },
    groupMessageReceived: (state, action) => {
      const {
        currentUserId,
        group_id,
        sender_id,
        text,
        content,
        attachment,
        created_at,
      } = action.payload || {};
      const preview = messagePreview({ text, content, attachment });
      if (!group_id || !preview) return;

      const conversationId = `group:${group_id}`;
      const conversation = state.conversations.find(
        (item) => item.id === conversationId,
      );
      if (!conversation) return;

      conversation.message = preview;
      conversation.time = formatTime(created_at);

      if (
        String(sender_id) !== String(currentUserId) &&
        state.activeConversationId !== conversationId
      ) {
        conversation.unread = (conversation.unread || 0) + 1;
      }
    },
    conversationsLoaded: (state, action) => {
      const { conversations = [], currentUserId } = action.payload || {};

      conversations.forEach((item) => {
        const otherUserId = item.user_id;
        const message = item.last_message;
        if (!otherUserId || !message) return;

        const conversation = state.conversations.find(
          (c) => c.id === String(otherUserId),
        );
        if (!conversation) return;

        conversation.message = messagePreview(message);
        conversation.time = formatTime(message.created_at);

        if (
          String(message.receiver_id) === String(currentUserId) &&
          !message.is_read &&
          state.activeConversationId !== String(otherUserId)
        ) {
          conversation.unread = Math.max(conversation.unread || 0, 1);
        }
      });
    },
    userPresenceChanged: (state, action) => {
      const { userId, status } = action.payload || {};
      if (!userId) return;

      const conversation = state.conversations.find(
        (item) => item.id === String(userId),
      );
      if (!conversation) return;

      conversation.isOnline = status === "online";
      if (status === "offline") {
        conversation.isTyping = false;
      }
    },
    typingStatusChanged: (state, action) => {
      const { senderId, isTyping } = action.payload || {};
      if (!senderId) return;

      const conversation = state.conversations.find(
        (item) => item.id === String(senderId),
      );
      if (!conversation) return;

      conversation.isTyping = Boolean(isTyping);
    },
  },
});

export const {
  conversationsLoaded,
  groupMessageReceived,
  messageReceived,
  messageSent,
  removeConversation,
  selectConversation,
  setContacts,
  setGroups,
  typingStatusChanged,
  userPresenceChanged,
} = chatSlice.actions;
export default chatSlice.reducer;
