import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useToast } from "@/hooks/use-toast";
import { Bot } from "lucide-react";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatContainerProps {
  chatId: string | null;
  onChatCreated?: (chatId: string) => void;
}

export const ChatContainer = ({ chatId, onChatCreated }: ChatContainerProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Load messages for current chat
  const loadMessages = async (currentChatId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', currentChatId)
        .order('created_at');

      if (error) throw error;

      const formattedMessages: Message[] = data.map(msg => ({
        id: msg.id,
        content: msg.content,
        isUser: msg.is_user,
        timestamp: new Date(msg.created_at),
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  // Save message to database
  const saveMessage = async (chatId: string, content: string, isUser: boolean) => {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          content,
          is_user: isUser,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;

      // Update chat's updated_at timestamp
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);

    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
    }
  };

  const sendMessage = async (content: string) => {
    let currentChatId = chatId;
    
    if (!currentChatId) {
      // Create new chat if none exists
      try {
        const { data, error } = await supabase
          .from('chats')
          .insert({ 
            title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
            user_id: (await supabase.auth.getUser()).data.user?.id
          })
          .select()
          .single();

        if (error) throw error;
        
        currentChatId = data.id;
        onChatCreated?.(data.id);
      } catch (error) {
        console.error('Erro ao criar chat:', error);
        toast({
          title: "Erro",
          description: "Não foi possível criar um novo chat.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);
    setStreamingMessage("");
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    await saveMessage(currentChatId, content, true);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { message: content }
      });

      if (error) {
        console.error('Erro na função:', error);
        throw new Error(error.message || 'Erro na função do chat');
      }

      if (!data?.response) {
        throw new Error('Resposta vazia do servidor');
      }

      // Simulate streaming effect for the response
      const botResponse = data.response;
      let currentText = "";
      
      for (let i = 0; i < botResponse.length; i++) {
        currentText += botResponse[i];
        setStreamingMessage(currentText);
        
        // Add a small delay to create the streaming effect
        await new Promise(resolve => setTimeout(resolve, 20));
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      setStreamingMessage("");
      await saveMessage(currentChatId, botResponse, false);

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: "Erro ao enviar mensagem",
        description: errorMessage,
        variant: "destructive",
      });

      const errorBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Desculpe, ocorreu um erro: ${errorMessage}`,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load messages when chatId changes
  useEffect(() => {
    if (chatId) {
      loadMessages(chatId);
    } else {
      setMessages([]);
    }
  }, [chatId]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-background via-surface/30 to-accent/10">
      <header className="flex items-center gap-3 p-6 border-b border-border/50 bg-surface/80 backdrop-blur-sm">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border border-primary/20">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Jarvis</h1>
          <p className="text-sm text-muted-foreground">Feito pela DTEC</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && !streamingMessage && !chatId && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Bem-vindo ao Jarvis</h2>
              <p className="text-muted-foreground max-w-md">
                Olá! Sou seu assistente virtual. Posso ajudar com diversas tarefas, responder perguntas e muito mais. Como posso ajudá-lo hoje?
              </p>
            </div>
          </div>
        )}

        {chatId && messages.length === 0 && !streamingMessage && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Nova Conversa</h2>
              <p className="text-muted-foreground max-w-md">
                Comece uma nova conversa! Digite sua mensagem abaixo.
              </p>
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message.content}
            isUser={message.isUser}
            timestamp={message.timestamp}
          />
        ))}
        
        {streamingMessage && (
          <ChatMessage
            message={streamingMessage}
            isUser={false}
            timestamp={new Date()}
          />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border/50 bg-surface/80 backdrop-blur-sm">
        <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};