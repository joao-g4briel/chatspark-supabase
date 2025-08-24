import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, MessageCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Chat {
  id: string;
  title: string;
  updated_at: string;
}

interface ChatSidebarProps {
  activeChat: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
}

export const ChatSidebar = ({ activeChat, onChatSelect, onNewChat }: ChatSidebarProps) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadChats = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setChats(data || []);
    } catch (error) {
      console.error('Erro ao carregar chats:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os chats.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewChat = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .insert({ title: 'Nova Conversa' })
        .select()
        .single();

      if (error) throw error;
      
      await loadChats();
      onChatSelect(data.id);
      onNewChat();
    } catch (error) {
      console.error('Erro ao criar novo chat:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar um novo chat.",
        variant: "destructive",
      });
    }
  };

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (error) throw error;
      
      await loadChats();
      if (activeChat === chatId) {
        onNewChat();
      }
      
      toast({
        title: "Sucesso",
        description: "Chat excluído com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir chat:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o chat.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Ontem';
    } else if (diffDays < 7) {
      return `${diffDays} dias atrás`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  return (
    <div className="h-full flex flex-col bg-surface/50 border-r border-border">
      <div className="p-4 border-b border-border">
        <Button 
          onClick={createNewChat}
          className="w-full justify-start gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          Novo Chat
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <div className="space-y-2 p-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-surface rounded animate-pulse" />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center text-muted-foreground p-4">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum chat ainda</p>
            <p className="text-xs">Crie seu primeiro chat</p>
          </div>
        ) : (
          chats.map((chat) => (
            <Card 
              key={chat.id}
              className={`p-3 cursor-pointer transition-all duration-200 group hover:bg-accent/50 ${
                activeChat === chat.id ? 'bg-accent border-primary/20' : 'bg-surface/30 hover:bg-surface/50'
              }`}
              onClick={() => onChatSelect(chat.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-foreground truncate">
                    {chat.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(chat.updated_at)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto w-auto text-muted-foreground hover:text-destructive"
                  onClick={(e) => deleteChat(chat.id, e)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};