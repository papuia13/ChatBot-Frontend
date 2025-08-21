import { Plus, MessageSquare, LogOut, MoreVertical, Pencil, Pin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  pinned?: boolean;
}

interface ChatSidebarProps {
  chats: Chat[];
  activeChat: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onSignOut: () => void;
  userName: string;
  onRenameChat?: (chatId: string, newTitle: string) => void | Promise<void>;
  onDeleteChat?: (chatId: string) => void | Promise<void>;
  onPinToggle?: (chatId: string) => void | Promise<void>;
}

// Natural timestamp formatter
function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (sec < 30) return "just now";
  if (sec < 60) return `${sec}s ago`;
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;

  // Yesterday check
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  const isYesterday = d.getDate() === y.getDate() && d.getMonth() === y.getMonth() && d.getFullYear() === y.getFullYear();
  if (isYesterday) return "Yesterday";

  // Within 7 days show weekday
  if (day < 7) return d.toLocaleDateString(undefined, { weekday: "short" });

  // Else short date
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: now.getFullYear() === d.getFullYear() ? undefined : "2-digit" });
}

const ChatSidebar = ({ 
  chats, 
  activeChat, 
  onChatSelect, 
  onNewChat, 
  onSignOut,
  userName,
  onRenameChat,
  onDeleteChat,
  onPinToggle,
}: ChatSidebarProps) => {
  return (
    <div className="w-80 bg-chat-sidebar border-r border-border/50 flex flex-col h-full overflow-x-hidden">
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
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">
        {chats.map((chat) => (
          <div key={chat.id} className={cn(
            "w-full rounded-lg transition-all duration-200 hover:bg-accent/50 overflow-hidden",
            activeChat === chat.id && "bg-accent"
          )}>
            <div className="relative flex items-center gap-2 p-3 min-h-14 overflow-hidden">
              <button
                onClick={() => onChatSelect(chat.id)}
                className="flex flex-1 items-center gap-3 text-left"
              >
                <MessageSquare className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0 pr-16">
                  <div className="flex items-center gap-1 min-w-0">
                    {chat.pinned && (
                      <Pin className="w-3.5 h-3.5 text-primary flex-none" />
                    )}
                    <h3
                      className="font-medium text-sm text-foreground overflow-hidden whitespace-nowrap"
                      style={{ WebkitMaskImage: "linear-gradient(90deg, #000 0, #000 20ch, rgba(0,0,0,0) 30ch, rgba(0,0,0,0) 100%)", maskImage: "linear-gradient(90deg, #000 0, #000 20ch, rgba(0,0,0,0) 30ch, rgba(0,0,0,0) 100%)" }}
                    >
                      {chat.title}
                    </h3>
                  </div>
                  <p
                    className="text-xs text-muted-foreground mt-1 overflow-hidden whitespace-nowrap"
                    style={{ WebkitMaskImage: "linear-gradient(90deg, #000 0, #000 70%, rgba(0,0,0,0) 100%)", maskImage: "linear-gradient(90deg, #000 0, #000 70%, rgba(0,0,0,0) 100%)" }}
                  >
                    {chat.lastMessage}
                  </p>
                  <p
                    className="text-xs text-muted-foreground mt-1 overflow-hidden whitespace-nowrap"
                    style={{ WebkitMaskImage: "linear-gradient(90deg, #000 65%, rgba(0,0,0,0))", maskImage: "linear-gradient(90deg, #000 65%, rgba(0,0,0,0))" }}
                  >
                    {formatTimestamp(chat.timestamp)}
                  </p>
                </div>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem
                    onClick={() => {
                      const name = window.prompt("Rename chat", chat.title);
                      if (name && name.trim()) onRenameChat?.(chat.id, name.trim());
                    }}
                  >
                    <Pencil className="w-4 h-4 mr-2" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPinToggle?.(chat.id)}>
                    <Pin className="w-4 h-4 mr-2" /> {chat.pinned ? "Unpin" : "Pin"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      if (window.confirm("Delete this chat?")) onDeleteChat?.(chat.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
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