import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setUser } from "../Redux/authSlice";
import {
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
} from "../Redux/chatSlice";
import ChatWindow from "../components/ChatWindow";
import ConversationList from "../components/ConversationList";
import EmptyChatState from "../components/EmptyChatState";
import GroupDialog from "../components/GroupDialog";
import SearchBar from "../components/SearchBar";
import { apiUrls } from "../utils/apiUrls";

const formatMessageTime = (value) =>
  new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(value ? new Date(value) : new Date());

const createClientId = () =>
  window.crypto?.randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const normalizeMessage = (message, currentUserId) => {
  const createdAt =
    message.created_at || message.createdAt || new Date().toISOString();
  const senderId = String(message.sender_id);

  return {
    id: String(message.id || message.client_id),
    clientId: message.client_id ? String(message.client_id) : null,
    body: message.content || message.text || "",
    direction: senderId === String(currentUserId) ? "sent" : "received",
    time: formatMessageTime(createdAt),
    createdAt,
    senderId,
    receiverId: message.receiver_id ? String(message.receiver_id) : null,
    groupId: message.group_id ? String(message.group_id) : null,
    isRead: Boolean(message.is_read),
    pending: Boolean(message.pending),
    attachment: message.attachment
      ? {
          fileName: message.attachment.file_name,
          contentType: message.attachment.content_type,
          fileSize: message.attachment.file_size,
          category: message.attachment.category,
          s3Key: message.attachment.s3_key,
          url: message.attachment.url,
        }
      : null,
  };
};

const mergeMessages = (currentMessages = [], nextMessages = []) => {
  const byId = new Map(currentMessages.map((message) => [message.id, message]));

  nextMessages.forEach((message) => {
    if (message.clientId && byId.has(message.clientId)) {
      byId.delete(message.clientId);
    }
    byId.set(message.id, message);
  });

  return Array.from(byId.values()).sort(
    (first, second) => new Date(first.createdAt) - new Date(second.createdAt),
  );
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const [contacts, setContactOptions] = useState([]);
  const [groupDraft, setGroupDraft] = useState({ name: "", description: "" });
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState([]);
  const [groupCreateStatus, setGroupCreateStatus] = useState({
    isLoading: false,
    error: "",
  });
  const [groupMembersById, setGroupMembersById] = useState({});
  const [groupMemberStatusById, setGroupMemberStatusById] = useState({});
  const [messagesByConversationId, setMessagesByConversationId] = useState({});
  const [historyStatusByConversationId, setHistoryStatusByConversationId] =
    useState({});
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id;
  const token = user?.token;
  const conversations = useSelector((state) => state.chat.conversations);
  const activeConversationId = useSelector(
    (state) => state.chat.activeConversationId,
  );

  useEffect(() => {
    const hashParams = new URLSearchParams(
      window.location.hash.replace(/^#/, ""),
    );
    const authParam = (key) => params.get(key) || hashParams.get(key);
    const id = authParam("id");
    if (!id) return;

    dispatch(
      setUser({
        id,
        name: authParam("name"),
        email: authParam("email"),
        picture: authParam("picture"),
        token: authParam("token"),
      }),
    );
    navigate("/dashboard", { replace: true });
  }, [dispatch, navigate, params]);

  useEffect(() => {
    if (userId && !token) {
      navigate("/", { replace: true });
    }
  }, [navigate, token, userId]);

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token],
  );

  const loadGroups = useCallback(async () => {
    const groupsResponse = await fetch(apiUrls.groups, {
      headers: authHeaders,
    });
    if (!groupsResponse.ok) throw new Error("Failed to fetch groups");

    const groups = await groupsResponse.json();
    const groupsWithMembers = await Promise.all(
      groups.map(async (group) => {
        try {
          const membersResponse = await fetch(apiUrls.groupMembers(group.id), {
            headers: authHeaders,
          });
          if (!membersResponse.ok) return group;

          const members = await membersResponse.json();
          setGroupMembersById((current) => ({
            ...current,
            [String(group.id)]: members,
          }));
          return { ...group, memberCount: members.length };
        } catch {
          return group;
        }
      }),
    );

    dispatch(setGroups({ groups: groupsWithMembers }));
  }, [authHeaders, dispatch]);

  useEffect(() => {
    if (!userId || !token) return;

    let isMounted = true;

    const fetchUsers = async () => {
      try {
        const response = await fetch(apiUrls.users, { headers: authHeaders });
        if (!response.ok) throw new Error("Failed to fetch users");

        const users = await response.json();
        if (isMounted) {
          setContactOptions(users);
          dispatch(setContacts({ users, currentUserId: userId }));
        }

        try {
          const conversationsResponse = await fetch(
            apiUrls.recentConversations(userId),
            { headers: authHeaders },
          );
          if (!conversationsResponse.ok)
            throw new Error("Failed to fetch recent conversations");

          const recentConversations = await conversationsResponse.json();
          if (isMounted) {
            dispatch(
              conversationsLoaded({
                conversations: recentConversations,
                currentUserId: userId,
              }),
            );
          }
        } catch {
          if (isMounted) {
            dispatch(
              conversationsLoaded({ conversations: [], currentUserId: userId }),
            );
          }
        }

        try {
          await loadGroups();
        } catch {
          if (isMounted) {
            dispatch(setGroups({ groups: [] }));
          }
        }
      } catch {
        if (isMounted) {
          setContactOptions([]);
          dispatch(setContacts({ users: [], currentUserId: userId }));
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [authHeaders, dispatch, loadGroups, token, userId]);

  // Single persistent socket — handles private messages, group messages,
  // presence, and typing indicators, regardless of which conversation is open.
  useEffect(() => {
    if (!userId || !token) return;

    let shouldReconnect = true;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (!shouldReconnect || reconnectTimerRef.current) return;

      const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 8000);
      reconnectAttemptsRef.current += 1;

      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        connectSocket();
      }, delay);
    };

    const handleSocketMessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.error) return;

        if (payload.type === "presence") {
          dispatch(
            userPresenceChanged({
              userId: String(payload.user_id),
              status: payload.status,
            }),
          );
          return;
        }

        if (payload.type === "typing") {
          dispatch(
            typingStatusChanged({
              senderId: String(payload.sender_id),
              isTyping: Boolean(payload.is_typing),
            }),
          );
          return;
        }

        if (payload.type === "group_message") {
          const conversationId = `group:${payload.group_id}`;
          const nextMessage = normalizeMessage(payload, userId);

          setMessagesByConversationId((current) => ({
            ...current,
            [conversationId]: mergeMessages(current[conversationId], [
              nextMessage,
            ]),
          }));
          dispatch(groupMessageReceived({ ...payload, currentUserId: userId }));
          return;
        }

        const senderId = String(payload.sender_id);
        const receiverId = String(payload.receiver_id);
        const conversationId =
          senderId === String(userId) ? receiverId : senderId;
        const nextMessage = normalizeMessage(payload, userId);

        setMessagesByConversationId((current) => ({
          ...current,
          [conversationId]: mergeMessages(current[conversationId], [
            nextMessage,
          ]),
        }));
        dispatch(messageReceived({ ...payload, currentUserId: userId }));
      } catch {
        return;
      }
    };

    const connectSocket = () => {
      if (!shouldReconnect) return;

      if (
        socketRef.current &&
        socketRef.current.readyState !== WebSocket.CLOSED &&
        socketRef.current.readyState !== WebSocket.CLOSING
      ) {
        socketRef.current.close();
      }

      const socket = token
        ? new WebSocket(apiUrls.userSocket({ userId }), ["bearer", token])
        : new WebSocket(apiUrls.userSocket({ userId }));
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttemptsRef.current = 0;
      };

      socket.onmessage = handleSocketMessage;

      socket.onclose = () => {
        if (socketRef.current === socket) {
          socketRef.current = null;
          scheduleReconnect();
        }
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    clearReconnectTimer();
    connectSocket();

    return () => {
      shouldReconnect = false;
      clearReconnectTimer();
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [dispatch, token, userId]);

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === activeConversationId,
      ) || null,
    [activeConversationId, conversations],
  );
  const selectedConversationId = selectedConversation?.id || null;
  const selectedGroupId =
    selectedConversation?.type === "group"
      ? selectedConversation.groupId
      : null;
  const canDeleteSelectedGroup =
    Boolean(selectedGroupId) &&
    String(selectedConversation?.createdBy) === String(userId);

  const selectedMessages = selectedConversation
    ? messagesByConversationId[selectedConversation.id] || []
    : [];
  const selectedHistoryStatus = selectedConversation
    ? historyStatusByConversationId[selectedConversation.id] || {}
    : {};
  const selectedGroupMembers =
    selectedConversation?.type === "group"
      ? groupMembersById[selectedConversation.groupId] || []
      : [];
  const selectedGroupMemberStatus =
    selectedConversation?.type === "group"
      ? groupMemberStatusById[selectedConversation.groupId] || {}
      : {};
  const isDeletingSelectedGroup = Boolean(
    selectedGroupId && selectedGroupMemberStatus.isDeleting,
  );

  useEffect(() => {
    if (!selectedGroupId) return;

    const groupId = selectedGroupId;
    let isMounted = true;

    const fetchMembers = async () => {
      setGroupMemberStatusById((current) => ({
        ...current,
        [groupId]: { isLoading: true, error: "" },
      }));

      try {
        const response = await fetch(apiUrls.groupMembers(groupId), {
          headers: authHeaders,
        });
        if (!response.ok) throw new Error("Failed to fetch group members");

        const members = await response.json();
        if (isMounted) {
          setGroupMembersById((current) => ({
            ...current,
            [groupId]: members,
          }));
          setGroupMemberStatusById((current) => ({
            ...current,
            [groupId]: { isLoading: false, error: "" },
          }));
        }
      } catch {
        if (isMounted) {
          setGroupMemberStatusById((current) => ({
            ...current,
            [groupId]: {
              isLoading: false,
              error: "Unable to update group members.",
            },
          }));
        }
      }
    };

    fetchMembers();

    return () => {
      isMounted = false;
    };
  }, [authHeaders, selectedGroupId]);

  useEffect(() => {
    if (!selectedConversationId || !userId || !token) return;

    const conversationId = selectedConversationId;
    const isGroup = Boolean(selectedGroupId);
    const groupId = selectedGroupId;
    let isMounted = true;

    const fetchHistory = async () => {
      if (isMounted) {
        setHistoryStatusByConversationId((current) => ({
          ...current,
          [conversationId]: { isLoading: true, error: "" },
        }));
      }

      try {
        const response = await fetch(
          isGroup
            ? apiUrls.groupMessages(groupId)
            : apiUrls.chatHistory({ userId, otherUserId: conversationId }),
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!response.ok) throw new Error("Failed to fetch chat history");

        const history = await response.json();
        const messages = history.map((message) =>
          normalizeMessage(message, userId),
        );

        if (isMounted) {
          setMessagesByConversationId((current) => ({
            ...current,
            [conversationId]: mergeMessages([], messages),
          }));
          setHistoryStatusByConversationId((current) => ({
            ...current,
            [conversationId]: { isLoading: false, error: "" },
          }));
        }

        if (!isGroup) {
          fetch(apiUrls.markMessagesRead, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              user_id: userId,
              other_user_id: conversationId,
            }),
          }).catch(() => undefined);
        }
      } catch {
        if (isMounted) {
          setHistoryStatusByConversationId((current) => ({
            ...current,
            [conversationId]: {
              isLoading: false,
              error: "Unable to load messages. Please try again.",
            },
          }));
        }
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [selectedConversationId, selectedGroupId, token, userId]);

  const handleSelectConversation = useCallback(
    (conversation) => {
      dispatch(selectConversation(conversation.id));
    },
    [dispatch],
  );

  const handleCreateGroup = useCallback(
    async (event) => {
      event.preventDefault();
      const name = groupDraft.name.trim();
      const description = groupDraft.description.trim();
      if (!name) return;

      setGroupCreateStatus({ isLoading: true, error: "" });

      try {
        const response = await fetch(apiUrls.groups, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({
            name,
            description: description || null,
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.detail || "Unable to create group.");
        }

        const group = await response.json();

        await Promise.all(
          selectedGroupMemberIds.map((memberUserId) =>
            fetch(apiUrls.groupMembers(group.id), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...authHeaders,
              },
              body: JSON.stringify({ user_id: memberUserId }),
            }).then(async (memberResponse) => {
              if (!memberResponse.ok && memberResponse.status !== 409) {
                const payload = await memberResponse.json().catch(() => ({}));
                throw new Error(payload.detail || "Unable to add member.");
              }
            }),
          ),
        );

        setGroupDraft({ name: "", description: "" });
        setSelectedGroupMemberIds([]);
        setIsGroupDialogOpen(false);
        setGroupCreateStatus({ isLoading: false, error: "" });
        await loadGroups();
        dispatch(selectConversation(`group:${group.id}`));
      } catch (error) {
        setGroupCreateStatus({
          isLoading: false,
          error: error.message || "Unable to create group.",
        });
      }
    },
    [
      authHeaders,
      dispatch,
      groupDraft.description,
      groupDraft.name,
      loadGroups,
      selectedGroupMemberIds,
    ],
  );

  const handleCloseGroupDialog = useCallback(() => {
    if (groupCreateStatus.isLoading) return;
    setIsGroupDialogOpen(false);
    setGroupCreateStatus({ isLoading: false, error: "" });
  }, [groupCreateStatus.isLoading]);

  const handleToggleGroupMember = useCallback((memberUserId) => {
    setSelectedGroupMemberIds((current) =>
      current.includes(memberUserId)
        ? current.filter((id) => id !== memberUserId)
        : [...current, memberUserId],
    );
  }, []);

  const handleAddGroupMember = useCallback(
    async (memberUserId) => {
      if (!selectedConversation || selectedConversation.type !== "group")
        return;

      const groupId = selectedConversation.groupId;
      setGroupMemberStatusById((current) => ({
        ...current,
        [groupId]: { isLoading: false, error: "" },
      }));

      try {
        const response = await fetch(apiUrls.groupMembers(groupId), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({ user_id: memberUserId }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.detail || "Unable to add member.");
        }

        const membersResponse = await fetch(apiUrls.groupMembers(groupId), {
          headers: authHeaders,
        });
        if (!membersResponse.ok) throw new Error("Unable to load members.");

        const members = await membersResponse.json();
        setGroupMembersById((current) => ({
          ...current,
          [groupId]: members,
        }));
        setGroupMemberStatusById((current) => ({
          ...current,
          [groupId]: { isLoading: false, error: "" },
        }));
        await loadGroups();
      } catch (error) {
        setGroupMemberStatusById((current) => ({
          ...current,
          [groupId]: {
            isLoading: false,
            error: error.message || "Unable to add member.",
          },
        }));
      }
    },
    [authHeaders, loadGroups, selectedConversation],
  );

  const handleDeleteGroup = useCallback(async () => {
    if (!selectedGroupId || !selectedConversationId) return;

    const shouldDelete = window.confirm(
      "Delete this group and its messages? This cannot be undone.",
    );
    if (!shouldDelete) return;

    setGroupMemberStatusById((current) => ({
      ...current,
      [selectedGroupId]: {
        ...(current[selectedGroupId] || {}),
        isDeleting: true,
        error: "",
      },
    }));

    try {
      const response = await fetch(apiUrls.group(selectedGroupId), {
        method: "DELETE",
        headers: authHeaders,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || "Unable to delete group.");
      }

      setMessagesByConversationId((current) => {
        const next = { ...current };
        delete next[selectedConversationId];
        return next;
      });
      setGroupMembersById((current) => {
        const next = { ...current };
        delete next[selectedGroupId];
        return next;
      });
      setGroupMemberStatusById((current) => {
        const next = { ...current };
        delete next[selectedGroupId];
        return next;
      });
      dispatch(removeConversation(selectedConversationId));
    } catch (error) {
      setGroupMemberStatusById((current) => ({
        ...current,
        [selectedGroupId]: {
          ...(current[selectedGroupId] || {}),
          isDeleting: false,
          error: error.message || "Unable to delete group.",
        },
      }));
    }
  }, [authHeaders, dispatch, selectedConversationId, selectedGroupId]);

  const handleSendMessage = useCallback(
    (text) => {
      if (!selectedConversation || !userId) return;

      const isGroup = selectedConversation.type === "group";
      const receiverId = selectedConversation.id;
      const clientId = createClientId();
      const payload = isGroup
        ? {
            type: "group_message",
            client_id: clientId,
            group_id: selectedConversation.groupId,
            text,
          }
        : {
            type: "private_message",
            client_id: clientId,
            receiver_id: receiverId,
            text,
          };

      if (socketRef.current?.readyState !== WebSocket.OPEN) {
        setHistoryStatusByConversationId((current) => ({
          ...current,
          [receiverId]: {
            ...(current[receiverId] || {}),
            error: "Connection lost. Please wait and try again.",
          },
        }));
        return;
      }

      socketRef.current.send(JSON.stringify(payload));

      const optimisticMessage = normalizeMessage(
        {
          id: clientId,
          client_id: clientId,
          sender_id: userId,
          receiver_id: isGroup ? null : receiverId,
          group_id: isGroup ? selectedConversation.groupId : null,
          content: text,
          created_at: new Date().toISOString(),
          pending: true,
        },
        userId,
      );

      setMessagesByConversationId((current) => ({
        ...current,
        [receiverId]: mergeMessages(current[receiverId], [optimisticMessage]),
      }));
      if (isGroup) {
        dispatch(
          groupMessageReceived({
            group_id: selectedConversation.groupId,
            sender_id: userId,
            content: text,
            currentUserId: userId,
          }),
        );
      } else {
        dispatch(messageSent({ receiverId, text }));
      }
    },
    [dispatch, selectedConversation, userId],
  );

  const handleSendAttachment = useCallback(
    (file, onProgress) =>
      new Promise((resolve, reject) => {
        if (!selectedConversation || !userId || !token) {
          reject(new Error("Select a conversation before attaching a file."));
          return;
        }

        const isGroup = selectedConversation.type === "group";
        const conversationId = selectedConversation.id;
        const formData = new FormData();
        formData.append("file", file);
        formData.append("content", "");
        formData.append(
          isGroup ? "group_id" : "receiver_id",
          isGroup ? selectedConversation.groupId : selectedConversation.id,
        );

        const request = new XMLHttpRequest();
        request.open("POST", apiUrls.messageAttachments);
        request.setRequestHeader("Authorization", `Bearer ${token}`);

        request.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          onProgress?.(Math.round((event.loaded / event.total) * 100));
        };

        request.onload = () => {
          let payload;
          try {
            payload = JSON.parse(request.responseText || "{}");
          } catch {
            payload = {};
          }
          if (request.status < 200 || request.status >= 300) {
            reject(new Error(payload.detail || "Unable to upload attachment."));
            return;
          }

          const nextMessage = normalizeMessage(payload, userId);
          setMessagesByConversationId((current) => ({
            ...current,
            [conversationId]: mergeMessages(current[conversationId], [
              nextMessage,
            ]),
          }));

          if (isGroup) {
            dispatch(groupMessageReceived({ ...payload, currentUserId: userId }));
          } else {
            dispatch(messageReceived({ ...payload, currentUserId: userId }));
          }

          onProgress?.(100);
          resolve(payload);
        };

        request.onerror = () => {
          reject(new Error("Unable to upload attachment."));
        };

        request.send(formData);
      }),
    [dispatch, selectedConversation, token, userId],
  );

  const handleTypingChange = useCallback(
    (isTyping) => {
      if (!selectedConversation || !userId) return;
      if (socketRef.current?.readyState !== WebSocket.OPEN) return;

      const payload =
        selectedConversation.type === "group"
          ? {
              type: "group_typing",
              group_id: selectedConversation.groupId,
              is_typing: Boolean(isTyping),
            }
          : {
              type: "typing",
              receiver_id: selectedConversation.id,
              is_typing: Boolean(isTyping),
            };

      socketRef.current.send(JSON.stringify(payload));
    },
    [selectedConversation, userId],
  );

  return (
    <main
      className="relative min-h-0 flex-1 overflow-hidden bg-[#070610] text-[#F5F1FA]"
      aria-label="Chat dashboard"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_32%,rgba(95,60,190,0.16),transparent_34%),linear-gradient(90deg,rgba(15,13,25,0.72),rgba(7,6,16,0.2)_38%,rgba(7,6,16,0.92))]"
        aria-hidden="true"
      />

      <div className="relative grid h-full min-h-0 grid-cols-1 lg:grid-cols-[400px_minmax(0,1fr)]">
        <aside className="min-h-0 border-b border-white/8 bg-[#0B0A14]/92 p-5 backdrop-blur-xl lg:h-full lg:border-b-0 lg:border-r lg:p-7">
          <div className="flex h-full min-h-0 flex-col rounded-xl border border-white/7 bg-[#0E0C18]/72 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.035)] sm:p-5">
            <SearchBar />
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversation?.id}
              onSelectConversation={handleSelectConversation}
              onCreateGroup={() => setIsGroupDialogOpen(true)}
            />
          </div>
        </aside>

        {selectedConversation ? (
          <ChatWindow
            key={selectedConversation.id}
            conversation={selectedConversation}
            messages={selectedMessages}
            contacts={contacts}
            groupMembers={selectedGroupMembers}
            groupActionError={selectedGroupMemberStatus.error}
            canDeleteGroup={canDeleteSelectedGroup}
            isDeletingGroup={isDeletingSelectedGroup}
            isGroupMembersLoading={Boolean(selectedGroupMemberStatus.isLoading)}
            isLoading={Boolean(selectedHistoryStatus.isLoading)}
            error={selectedHistoryStatus.error}
            onAddGroupMember={handleAddGroupMember}
            onDeleteGroup={handleDeleteGroup}
            onSendAttachment={handleSendAttachment}
            onSendMessage={handleSendMessage}
            onTypingChange={handleTypingChange}
          />
        ) : (
          <EmptyChatState />
        )}
      </div>

      <GroupDialog
        open={isGroupDialogOpen}
        contacts={contacts}
        groupName={groupDraft.name}
        groupDescription={groupDraft.description}
        selectedMemberIds={selectedGroupMemberIds}
        isCreating={groupCreateStatus.isLoading}
        error={groupCreateStatus.error}
        onClose={handleCloseGroupDialog}
        onGroupNameChange={(name) =>
          setGroupDraft((current) => ({ ...current, name }))
        }
        onGroupDescriptionChange={(description) =>
          setGroupDraft((current) => ({ ...current, description }))
        }
        onToggleMember={handleToggleGroupMember}
        onCreateGroup={handleCreateGroup}
      />
    </main>
  );
};

export default Dashboard;
