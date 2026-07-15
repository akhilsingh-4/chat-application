export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";

const getWebSocketBaseUrl = () => {
  if (API_BASE_URL.startsWith("http")) {
    return API_BASE_URL.replace(/^http/, "ws");
  }

  if (typeof window === "undefined") {
    return "";
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${API_BASE_URL}`;
};

export const WS_BASE_URL = getWebSocketBaseUrl();

export const apiUrls = {
  googleLogin: `${API_BASE_URL}/api/auth/google/login`,
  users: `${API_BASE_URL}/api/users`,
  chatHistory: ({ userId, otherUserId }) =>
    `${API_BASE_URL}/api/messages/history/${encodeURIComponent(otherUserId)}?user_id=${encodeURIComponent(userId)}`,
  recentConversations: (userId) =>
    `${API_BASE_URL}/api/messages/conversations/${encodeURIComponent(userId)}`,
  markMessagesRead: `${API_BASE_URL}/api/messages/read`,
  messageAttachments: `${API_BASE_URL}/api/messages/attachments`,
  messageAttachmentUrl: (messageId) =>
    `${API_BASE_URL}/api/messages/${encodeURIComponent(messageId)}/attachment-url`,
  message: ({ messageId, userId }) =>
    `${API_BASE_URL}/api/messages/${encodeURIComponent(messageId)}${
      userId ? `?user_id=${encodeURIComponent(userId)}` : ""
    }`,
  userSocket: ({ userId }) => `${WS_BASE_URL}/api/ws/${encodeURIComponent(userId)}`,
  groups: `${API_BASE_URL}/api/groups`,
  group: (groupId) =>
    `${API_BASE_URL}/api/groups/${encodeURIComponent(groupId)}`,
  groupMembers: (groupId) =>
    `${API_BASE_URL}/api/groups/${encodeURIComponent(groupId)}/members`,
  groupMessages: (groupId) =>
    `${API_BASE_URL}/api/groups/${encodeURIComponent(groupId)}/messages`,
  groupSocket: ({ groupId }) =>
    `${WS_BASE_URL}/api/ws/groups/${encodeURIComponent(groupId)}`,
};
