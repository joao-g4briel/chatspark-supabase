import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
}

export const ChatMessage = ({ message, isUser, timestamp }: ChatMessageProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setIsCopied(true);
      toast({
        description: "Texto copiado!",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast({
        description: "Erro ao copiar texto",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={cn(
      "flex mb-4 chat-message-enter group",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] px-4 py-3 rounded-2xl shadow-sm relative",
        isUser 
          ? "chat-message-user rounded-br-md" 
          : "chat-message-bot rounded-bl-md"
      )}>
        <button
          onClick={handleCopy}
          className={cn(
            "absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity",
            "hover:bg-background/10 text-foreground/60 hover:text-foreground/80"
          )}
        >
          {isCopied ? (
            <Check className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
        <p className="text-sm leading-relaxed whitespace-pre-wrap pr-8">{message}</p>
        <p className={cn(
          "text-xs mt-1 opacity-70",
          isUser ? "text-right" : "text-left"
        )}>
          {timestamp.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
    </div>
  );
};