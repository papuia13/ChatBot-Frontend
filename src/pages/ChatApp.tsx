import { useEffect, useMemo, useState } from "react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatInterface, { Message } from "@/components/chat/ChatInterface";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useSubscription } from "urql";
import {
  SUB_CHATS,
  SUB_MESSAGES,
  MUT_CREATE_CHAT,
  MUT_INSERT_USER_MESSAGE,
  MUT_SEND_MESSAGE,
  MUT_UPDATE_CHAT_TITLE,
  MUT_DELETE_CHAT,
} from "@/lib/graphql";

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messages: Message[];
  pinned?: boolean;
}

interface ChatAppProps {
  userName: string;
  onSignOut: () => void;
}

const ChatApp = ({ userName, onSignOut }: ChatAppProps) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("pinnedChats");
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      return new Set(arr);
    } catch {
      return new Set();
    }
  });
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [lastSendAt, setLastSendAt] = useState<number>(0);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when switching to mobile; open by default on desktop
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
    else setSidebarOpen(true);
  }, [isMobile]);

  // GraphQL: subscribe to chats
  const [chatsSub] = useSubscription({ query: SUB_CHATS });

  // Build chats state from subscription (preserve existing messages, avoid flicker)
  useEffect(() => {
    if (chatsSub.data?.chats) {
      const preview = (text: string, max = 30) => {
        const t = text?.toString().replace(/\s+/g, " ").trim() ?? "";
        return t.length > max ? t.slice(0, max) + "…" : t;
      };
      setChats(prev => {
        const prevById = new Map(prev.map(c => [c.id, c] as const));
        const next: Chat[] = chatsSub.data.chats.map((c: any) => {
          const last = c.messages?.[0];
          const lastMessage = last?.content ? preview(last.content) : "";
          const ts = last?.created_at ?? c.updated_at;
          const existing = prevById.get(c.id);
          return {
            id: c.id,
            title: c.title,
            lastMessage: lastMessage || existing?.lastMessage || "",
            timestamp: new Date(ts).toISOString(),
            messages: existing?.messages ?? [],
            pinned: pinnedIds.has(c.id),
          };
        });
        // If activeChat isn't present yet in subscription payload, keep existing entry to avoid UI fallback
        if (activeChat && !next.find(c => c.id === activeChat)) {
          const keep = prevById.get(activeChat);
          if (keep) next.unshift(keep);
        }
        // Sort: pinned first, then by timestamp desc
        return next.sort((a, b) => {
          const pa = a.pinned ? 1 : 0;
          const pb = b.pinned ? 1 : 0;
          if (pa !== pb) return pb - pa;
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
      });
      // Ensure some chat is active
      // If none selected, select the first incoming chat
      // Do not overwrite an already selected activeChat
      // This avoids toggling away from the conversation view
      // when the subscription updates
      // (no-op if activeChat already set)
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      (!activeChat && chatsSub.data.chats.length > 0) && setActiveChat(chatsSub.data.chats[0].id);
    }
  }, [chatsSub.data, activeChat]);

  // Messages subscription for active chat (pause for temp IDs created optimistically)
  const pauseMessages = useMemo(() => !activeChat || activeChat.startsWith("temp-"), [activeChat]);
  const [messagesSub] = useSubscription(
    { query: SUB_MESSAGES, variables: { chat_id: activeChat }, pause: pauseMessages }
  );

  useEffect(() => {
    if (!messagesSub.data || !activeChat) return;
    const msgs: Message[] = messagesSub.data.messages.map((m: any) => ({
      id: m.id,
      content: m.content,
      isBot: m.role !== "user",
      timestamp: new Date(m.created_at).toISOString(),
    }));
    const preview = (text: string, max = 30) => {
      const t = text.replace(/\s+/g, " ").trim();
      return t.length > max ? t.slice(0, max) + "…" : t;
    };
    // Derive chat title from the first assistant message, if title is default/empty
    const maybeRenameFromAssistant = async () => {
      const current = chats.find(c => c.id === activeChat);
      const needsTitle = current && (!current.title || /^\s*$/.test(current.title) || /^New Chat$/i.test(current.title));
      if (!needsTitle) return;
      const firstAssistant = msgs.find(m => m.isBot);
      if (!firstAssistant) return;
      const deriveTitle = (text: string) => {
        const t = text.replace(/\s+/g, " ").trim();
        if (!t) return "New Chat";
        const sliced = t.slice(0, 40);
        const lastStop = Math.max(sliced.lastIndexOf("."), sliced.lastIndexOf("!"), sliced.lastIndexOf("?"), sliced.lastIndexOf(" "));
        const base = lastStop > 10 ? sliced.slice(0, lastStop) : sliced;
        return base.charAt(0).toUpperCase() + base.slice(1);
      };
      const newTitle = deriveTitle(firstAssistant.content);
      // optimistic update
      setChats(prev => prev.map(c => c.id === activeChat ? { ...c, title: newTitle } : c));
      try { await updateChatTitle({ id: activeChat, title: newTitle }); } catch (e) { console.warn("Auto-title from assistant failed", e); }
    };
    void maybeRenameFromAssistant();
    setChats(prev => {
      const updated = prev.map(chat => chat.id === activeChat ? {
        ...chat,
        messages: msgs,
        lastMessage: msgs.length ? preview(msgs[msgs.length - 1].content) : "",
        timestamp: msgs.length ? msgs[msgs.length - 1].timestamp : chat.timestamp,
      } : chat);
      // keep sorting invariant
      return updated.sort((a, b) => {
        const pa = (a.pinned ? 1 : 0);
        const pb = (b.pinned ? 1 : 0);
        if (pa !== pb) return pb - pa;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
    });
  }, [messagesSub.data, activeChat]);

  // Mutations
  const [, createChat] = useMutation(MUT_CREATE_CHAT);
  const [, insertUserMessage] = useMutation(MUT_INSERT_USER_MESSAGE);
  const [, sendMessageAction] = useMutation(MUT_SEND_MESSAGE);
  const [, updateChatTitle] = useMutation(MUT_UPDATE_CHAT_TITLE);
  const [, deleteChat] = useMutation(MUT_DELETE_CHAT);

  const handleNewChat = async () => {
    // Optimistically add a temp chat and make it active
    const tempId = `temp-${Date.now()}`;
    const nowIso = new Date().toISOString();
    setChats(prev => [{
      id: tempId,
      title: "New Chat",
      lastMessage: "",
      timestamp: nowIso,
      messages: [],
      pinned: false,
    }, ...prev]);
    setActiveChat(tempId);

    const result = await createChat({ title: "New Chat" });
    if (result.error) {
      // Rollback temp chat on failure
      setChats(prev => prev.filter(c => c.id !== tempId));
      toast({ title: "Failed to create chat", description: result.error.message });
      return;
    }
    const id = result.data?.insert_chats_one?.id as string | undefined;
    if (id) {
      // Replace temp chat id with real id and keep it active
      setChats(prev => prev.map(c => c.id === tempId ? { ...c, id } : c));
      setActiveChat(id);
      // Removed success toast on new chat creation
    }
  };

  const handleRenameTitle = async (newTitle: string) => {
    if (!activeChat) return;
    // optimistic update
    setChats(prev => prev.map(c => c.id === activeChat ? { ...c, title: newTitle } : c));
    const res = await updateChatTitle({ id: activeChat, title: newTitle });
    if (res.error) {
      toast({ title: "Failed to rename chat", description: res.error.message });
    } else {
      toast({ title: "Chat renamed" });
    }
  };

  // Sidebar actions
  const handleSidebarRename = async (chatId: string, newTitle: string) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: newTitle } : c));
    const res = await updateChatTitle({ id: chatId, title: newTitle });
    if (res.error) toast({ title: "Failed to rename chat", description: res.error.message });
  };

  const handleSidebarDelete = async (chatId: string) => {
    // optimistic remove
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (activeChat === chatId) {
      const remaining = chats.filter(c => c.id !== chatId);
      setActiveChat(remaining[0]?.id ?? null);
    }
    const res = await deleteChat({ id: chatId });
    if (res.error) toast({ title: "Failed to delete chat", description: res.error.message });
  };

  // Frontend pin toggle with persistence
  const handleSidebarPinToggle = async (chatId: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(chatId)) next.delete(chatId); else next.add(chatId);
      try { localStorage.setItem("pinnedChats", JSON.stringify(Array.from(next))); } catch { }
      return next;
    });
    setChats(prev => {
      const updated = prev.map(c => c.id === chatId ? { ...c, pinned: !c.pinned } : c);
      return updated.sort((a, b) => {
        const pa = (a.pinned ? 1 : 0);
        const pb = (b.pinned ? 1 : 0);
        if (pa !== pb) return pb - pa;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
    });
  };

  const handleSendMessage = async (content: string) => {
    if (!activeChat) {
      toast({ title: "No active chat", description: "Select or create a chat first." });
      return;
    }
    // Simple cooldown to avoid spamming the backend and hitting rate limits
    const nowMs = Date.now();
    if (nowMs - lastSendAt < 1000) {
      toast({ title: "Please wait", description: "You're sending messages too quickly. Try again in a second." });
      return;
    }
    setLastSendAt(nowMs);
    const nowIso = new Date().toISOString();
    const tempId = `temp-${Date.now()}`;
    const preview = (text: string, max = 30) => {
      const t = text.replace(/\s+/g, " ").trim();
      return t.length > max ? t.slice(0, max) + "…" : t;
    };
    // Optimistically add the user's message so it appears immediately
    setChats(prev => prev.map(c => c.id === activeChat ? {
      ...c,
      messages: [...c.messages, { id: tempId, content, isBot: false, timestamp: nowIso }],
      lastMessage: preview(content),
      timestamp: nowIso,
    } : c));
    // Insert user message
    console.log("insertUserMessage vars", { chat_id: activeChat, content });
    const insertRes = await insertUserMessage({ chat_id: activeChat, content });
    if (insertRes.error) {
      // Rollback optimistic message on failure
      setChats(prev => prev.map(c => c.id === activeChat ? {
        ...c,
        messages: c.messages.filter(m => m.id !== tempId),
        lastMessage: c.messages.length > 1 ? preview(c.messages[c.messages.length - 2].content) : "",
        timestamp: c.messages.length > 1 ? c.messages[c.messages.length - 2].timestamp : c.timestamp,
      } : c));
      toast({ title: "Failed to send", description: insertRes.error.message });
      return;
    }
    // Show typing while Action runs. Assistant message will arrive via subscription.
    setIsTyping(true);
    console.log("sendMessageAction vars", { chat_id: activeChat, content });
    const actionRes = await sendMessageAction({ chat_id: activeChat, content });
    if (actionRes.error) {
      const msg = actionRes.error.message || "";
      if (/429|rate limit/i.test(msg)) {
        toast({ title: "Rate limit reached", description: "Too many requests. Please wait a moment and try again." });
      } else {
        toast({ title: "Bot error", description: msg });
      }
    }
    setIsTyping(false);
  };

  const currentChat = chats.find(chat => chat.id === activeChat);

  return (
    <div className="h-screen relative bg-background overflow-hidden">
      {/* Desktop layout: persistent sidebar */}
      <div className="hidden md:flex h-full">
        <ChatSidebar
          chats={chats}
          activeChat={activeChat}
          onChatSelect={setActiveChat}
          onNewChat={handleNewChat}
          onSignOut={onSignOut}
          userName={userName}
          onRenameChat={handleSidebarRename}
          onDeleteChat={handleSidebarDelete}
          onPinToggle={handleSidebarPinToggle}
        />

        {activeChat ? (
          <div className="flex-1 flex">
            <ChatInterface
              messages={currentChat?.messages ?? []}
              onSendMessage={handleSendMessage}
              isTyping={isTyping}
              chatTitle={currentChat?.title ?? "New Chat"}
              onRenameTitle={handleRenameTitle}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-background">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-foreground mb-2">Select a chat to start</h2>
              <p className="text-muted-foreground">Choose an existing conversation or create a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile layout: toggleable sidebar overlay */}
      <div className="md:hidden h-full flex">
        {/* Toggle button */}
        {!sidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 left-3 z-30"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open chat menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}

        {/* Sidebar overlay */}
        <div
          className={`fixed inset-y-0 left-0 z-40 w-[85%] max-w-xs transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="h-full shadow-2xl">
            <ChatSidebar
              chats={chats}
              activeChat={activeChat}
              onChatSelect={(id) => {
                setActiveChat(id);
                setSidebarOpen(false);
              }}
              onNewChat={() => {
                void handleNewChat();
                setSidebarOpen(false);
              }}
              onSignOut={onSignOut}
              userName={userName}
              onRenameChat={handleSidebarRename}
              onDeleteChat={(id) => {
                void handleSidebarDelete(id);
                setSidebarOpen(false);
              }}
              onPinToggle={handleSidebarPinToggle}
            />
          </div>
        </div>
        {/* Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Chat area */}
        <div className="flex-1 flex">
          {activeChat ? (
            <div className="flex-1 flex">
              <ChatInterface
                messages={currentChat?.messages ?? []}
                onSendMessage={handleSendMessage}
                isTyping={isTyping}
                chatTitle={currentChat?.title ?? "New Chat"}
                onRenameTitle={handleRenameTitle}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-background">
              <div className="text-center px-6">
                <h2 className="text-xl font-semibold text-foreground mb-2">Select a chat to start</h2>
                <p className="text-muted-foreground">Open the menu to choose a conversation or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatApp;