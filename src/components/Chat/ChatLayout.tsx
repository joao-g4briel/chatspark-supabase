import { useState } from "react";
import { ChatSidebar } from "./ChatSidebar";
import { ChatContainer } from "./ChatContainer";

export const ChatLayout = () => {
  const [activeChat, setActiveChat] = useState<string | null>(null);

  const handleChatSelect = (chatId: string) => {
    setActiveChat(chatId);
  };

  const handleNewChat = () => {
    setActiveChat(null);
  };

  const handleChatCreated = (chatId: string) => {
    setActiveChat(chatId);
  };

  return (
    <div className="flex h-screen">
      <div className="w-80 flex-shrink-0">
        <ChatSidebar 
          activeChat={activeChat}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
        />
      </div>
      <div className="flex-1">
        <ChatContainer 
          chatId={activeChat}
          onChatCreated={handleChatCreated}
        />
      </div>
    </div>
  );
};