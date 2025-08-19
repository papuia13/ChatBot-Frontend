import { Plus, MessageSquare, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
}

interface ChatSidebarProps {
  chats: Chat[];
  activeChat: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onSignOut: () => void;
  userName: string;
}

const ChatSidebar = ({ 
  chats, 
  activeChat, 
  onChatSelect, 
  onNewChat, 
  onSignOut,
  userName 
}: ChatSidebarProps) => {
  return (
    <div className="w-80 bg-chat-sidebar border-r border-border/50 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Chats</h2>
          <Button
            onClick={onNewChat}
            size="sm"
            className="bg-primary hover:bg-primary-glow transition-colors"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onChatSelect(chat.id)}
            className={cn(
              "w-full p-3 rounded-lg text-left transition-all duration-200 hover:bg-accent/50",
              activeChat === chat.id && "bg-accent"
            )}
          >
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-foreground truncate">
                  {chat.title}
                </h3>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {chat.lastMessage}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {chat.timestamp}
                </p>
              </div>
            </div>
          </button>
        ))}
        
        {chats.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">
              No chats yet. Create your first chat!
            </p>
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {userName}
              </p>
            </div>
          </div>
          <Button
            onClick={onSignOut}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;