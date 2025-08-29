import { cn } from "@/lib/utils";

export const TypingIndicator = () => {
  return (
    <div className="flex mb-4 justify-start">
      <div className={cn(
        "max-w-[80%] px-4 py-3 rounded-2xl shadow-sm",
        "chat-message-bot rounded-bl-md"
      )}>
        <div className="flex items-center space-x-1">
          <span className="text-sm text-muted-foreground">Professor está digitando</span>
          <div className="flex space-x-1 ml-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};