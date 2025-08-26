import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para limpar pensamentos internos da resposta
function limparResposta(texto: string): string {
  // Remove tudo entre <think>...</think>
  let resultado = texto.replace(/<think>[\s\S]*?<\/think>/g, '');
  // Remove tudo entre ◁think▷...◁/think▷
  resultado = resultado.replace(/◁think▷[\s\S]*?◁\/think▷/g, '');
  return resultado.trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Função para buscar informações na web
    async function searchWeb(query: string): Promise<string> {
      try {
        const searchResponse = await fetch(`https://ddg-api.herokuapp.com/search?query=${encodeURIComponent(query)}&limit=5`);
        if (!searchResponse.ok) return '';
        
        const searchData = await searchResponse.json();
        if (!searchData || !searchData.length) return '';
        
        const results = searchData.slice(0, 3).map((item: any) => 
          `${item.title}: ${item.description}`
        ).join('\n\n');
        
        return results ? `Informações atuais da web:\n${results}\n\n` : '';
      } catch (error) {
        console.error('Erro na busca web:', error);
        return '';
      }
    }

    // Realizar busca web para perguntas que podem se beneficiar de informações atuais
    let webSearchResults = '';
    const shouldSearch = /\b(hoje|atual|recente|última|novo|nova|aconteceu|quando|onde|preço|cotação|notícia|covid|política|economia|esporte|tecnologia|2024|2025)\b/i.test(message);
    
    if (shouldSearch) {
      webSearchResults = await searchWeb(message);
    }

    // Get API key from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: configData, error: configError } = await supabase
      .from('config')
      .select('api_key')
      .eq('service', 'openrouter')
      .single();

    if (configError || !configData) {
      console.error('Error fetching API key:', configError);
      return new Response(
        JSON.stringify({ 
          error: '⚠️ API Key não configurada no Supabase.' 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${configData.api_key}`,
        'HTTP-Referer': req.headers.get('referer') || 'https://localhost:3000',
        'X-Title': 'Jarvis4 Chatbot',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
        messages: [
          {
            role: 'system',
            content: 'Você é Jarvis, um professor virtual. Siga estas regras: 1. Sempre que o usuário pedir "resuma" ou "resumo desse texto", faça o resumo da SUA ÚLTIMA RESPOSTA, sem pedir para ele reenviar o texto. 2. Quando o usuário perguntar "quem é você?", "qual seu nome?" ou algo parecido, responda de forma curta: "Olá, sou Jarvis, seu professor virtual." 3. Suas respostas devem ser claras, diretas e objetivas, evitando textos muito longos, exceto quando o usuário pedir mais detalhes. ⚠️ Importante: nunca exiba raciocínios internos, pensamentos ou texto dentro de <think>. Apenas responda ao usuário com a resposta final, de forma clara e direta.'
          },
          {
            role: 'user',
            content: webSearchResults + message
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', response.status, errorData);
      return new Response(
        JSON.stringify({ 
          error: 'Erro na API do OpenRouter. Verifique sua API key.' 
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    const rawBotResponse = data.choices?.[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.';
    const botResponse = limparResposta(rawBotResponse);

    return new Response(
      JSON.stringify({ 
        response: botResponse 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});