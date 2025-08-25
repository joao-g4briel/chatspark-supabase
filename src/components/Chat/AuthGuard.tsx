import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { AuthForm } from "@/components/Auth/AuthForm";
import { ChatLayout } from "./ChatLayout";
import { Button } from "@/components/ui/button";
import { LogOut, Bot } from "lucide-react";

export const AuthGuard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleAuthSuccess = () => {
    // Auth state will be updated by the listener
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-surface/30 to-accent/10">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bot className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-surface/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground">
            Logado como: {user.email}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
      <div className="flex-1">
        <ChatLayout />
      </div>
    </div>
  );
};