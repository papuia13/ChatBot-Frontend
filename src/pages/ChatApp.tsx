import { useState, useEffect } from "react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatInterface, { Message } from "@/components/chat/ChatInterface";
import { useToast } from "@/hooks/use-toast";

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

  // Load demo data
  useEffect(() => {
    const demoChats: Chat[] = [
      {
        id: "1",
        title: "Getting Started",
        lastMessage: "Welcome! How can I help you today?",
        timestamp: "2 min ago",
        messages: [
          {
            id: "1",
            content: "Hello! Welcome to the chatbot. How can I assist you today?",
            isBot: true,
            timestamp: new Date(Date.now() - 120000).toISOString(),
          }
        ]
      }
    ];
    setChats(demoChats);
    setActiveChat("1");
  }, []);

  const handleNewChat = () => {
    const newChatId = Date.now().toString();
    const newChat: Chat = {
      id: newChatId,
      title: "New Chat",
      lastMessage: "Start a conversation...",
      timestamp: "now",
      messages: []
    };
    
    setChats(prev => [newChat, ...prev]);
    setActiveChat(newChatId);
    
    toast({
      title: "New chat created",
      description: "You can start a new conversation now.",
    });
  };

  const handleSendMessage = async (content: string) => {
    if (!activeChat) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isBot: false,
      timestamp: new Date().toISOString(),
    };

    // Add user message
    setChats(prev => prev.map(chat => 
      chat.id === activeChat 
        ? {
            ...chat,
            messages: [...chat.messages, userMessage],
            lastMessage: content,
            timestamp: "now",
            title: chat.messages.length === 0 ? content.slice(0, 30) + "..." : chat.title
          }
        : chat
    ));

    // Show typing indicator
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Thank you for your message: "${content}". This is a demo response. In a real implementation, this would be connected to your backend GraphQL API and n8n workflow for AI responses.`,
        isBot: true,
        timestamp: new Date().toISOString(),
      };

      setChats(prev => prev.map(chat => 
        chat.id === activeChat 
          ? {
              ...chat,
              messages: [...chat.messages, botMessage],
              lastMessage: "Bot response received",
              timestamp: "now"
            }
          : chat
      ));

      setIsTyping(false);
    }, 2000);
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