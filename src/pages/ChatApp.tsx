import { useEffect, useMemo, useState } from "react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatInterface, { Message } from "@/components/chat/ChatInterface";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useSubscription } from "urql";
import {
  SUB_CHATS,
  SUB_MESSAGES,
  MUT_CREATE_CHAT,
  MUT_INSERT_USER_MESSAGE,
  MUT_SEND_MESSAGE,
} from "@/lib/graphql";

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messages: Message[];
}

interface ChatAppProps {
  userName: string;
  onSignOut: () => void;
}

const ChatApp = ({ userName, onSignOut }: ChatAppProps) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();

  // GraphQL: subscribe to chats
  const [chatsSub] = useSubscription({ query: SUB_CHATS });

  // Build chats state from subscription
  useEffect(() => {
    if (chatsSub.data?.chats) {
      const mapped: Chat[] = chatsSub.data.chats.map((c: any) => ({
        id: c.id,
        title: c.title,
        lastMessage: "",
        timestamp: new Date(c.updated_at).toISOString(),
        messages: [],
      }));
      setChats(mapped);
      if (!activeChat && mapped.length > 0) setActiveChat(mapped[0].id);
    }
  }, [chatsSub.data]);

  // Messages subscription for active chat
  const pauseMessages = useMemo(() => !activeChat, [activeChat]);
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
    setChats(prev => prev.map(chat => chat.id === activeChat ? {
      ...chat,
      messages: msgs,
      lastMessage: msgs.length ? msgs[msgs.length - 1].content : "",
      timestamp: msgs.length ? msgs[msgs.length - 1].timestamp : chat.timestamp,
    } : chat));
  }, [messagesSub.data, activeChat]);

  // Mutations
  const [, createChat] = useMutation(MUT_CREATE_CHAT);
  const [, insertUserMessage] = useMutation(MUT_INSERT_USER_MESSAGE);
  const [, sendMessageAction] = useMutation(MUT_SEND_MESSAGE);

  const handleNewChat = async () => {
    const result = await createChat({ title: "New Chat" });
    if (result.error) {
      toast({ title: "Failed to create chat", description: result.error.message });
      return;
    }
    const id = result.data?.insert_chats_one?.id as string | undefined;
    if (id) {
      setActiveChat(id);
      toast({ title: "New chat created", description: "You can start a new conversation now." });
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!activeChat) {
      toast({ title: "No active chat", description: "Select or create a chat first." });
      return;
    }
    // Insert user message
    console.log("insertUserMessage vars", { chat_id: activeChat, content });
    const insertRes = await insertUserMessage({ chat_id: activeChat, content });
    if (insertRes.error) {
      toast({ title: "Failed to send", description: insertRes.error.message });
      return;
    }
    // Show typing while Action runs. Assistant message will arrive via subscription.
    setIsTyping(true);
    console.log("sendMessageAction vars", { chat_id: activeChat, content });
    const actionRes = await sendMessageAction({ chat_id: activeChat, content });
    if (actionRes.error) {
      toast({ title: "Bot error", description: actionRes.error.message });
    }
    setIsTyping(false);
  };

  const currentChat = chats.find(chat => chat.id === activeChat);

  return (
    <div className="h-screen flex bg-background">
      <ChatSidebar
        chats={chats}
        activeChat={activeChat}
        onChatSelect={setActiveChat}
        onNewChat={handleNewChat}
        onSignOut={onSignOut}
        userName={userName}
      />

      {activeChat && currentChat ? (
        <ChatInterface
          messages={currentChat.messages}
          onSendMessage={handleSendMessage}
          isTyping={isTyping}
          chatTitle={currentChat.title}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Select a chat to start
            </h2>
            <p className="text-muted-foreground">
              Choose an existing conversation or create a new one
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatApp;