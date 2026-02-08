import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Função para extrair JSON de resposta com markdown
function extractJsonFromResponse(content: string): string {
  // Remove blocos de código markdown
  let cleaned = content.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
  
  // Tenta encontrar o JSON entre { e }
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  
  return cleaned;
}

// Valida e normaliza a resposta da IA
function validateAndNormalizeResponse(data: unknown): {
  summary: string;
  keyTopics: string[];
  tasks: Array<{
    title: string;
    description: string;
    durationMin: number;
    acceptanceCriteria: string[];
  }>;
  studyTips: string[];
} {
  const result: ReturnType<typeof validateAndNormalizeResponse> = {
    summary: "",
    keyTopics: [],
    tasks: [],
    studyTips: [],
  };
  
  if (typeof data !== 'object' || data === null) {
    throw new Error("Invalid response format");
  }
  
  const obj = data as Record<string, unknown>;
  
  // Summary
  if (typeof obj.summary === 'string') {
    result.summary = obj.summary;
  }
  
  // Key Topics
  if (Array.isArray(obj.keyTopics)) {
    result.keyTopics = obj.keyTopics
      .filter((t): t is string => typeof t === 'string')
      .slice(0, 5);
  }
  
  // Study Tips
  if (Array.isArray(obj.studyTips)) {
    result.studyTips = obj.studyTips
      .filter((t): t is string => typeof t === 'string')
      .slice(0, 3);
  }
  
  // Tasks (com durationMin, description e acceptanceCriteria)
  if (Array.isArray(obj.tasks)) {
    result.tasks = obj.tasks
      .filter((t): t is Record<string, unknown> => typeof t === 'object' && t !== null)
      .map(t => {
        let durationMin = 30;
        if (typeof t.durationMin === 'number') {
          durationMin = Math.min(180, Math.max(5, Math.round(t.durationMin)));
        }
        
        let acceptanceCriteria: string[] = [];
        if (Array.isArray(t.acceptanceCriteria)) {
          acceptanceCriteria = t.acceptanceCriteria
            .filter((c): c is string => typeof c === 'string')
            .slice(0, 3);
        }
        
        return {
          title: typeof t.title === 'string' ? t.title : "Tarefa",
          description: typeof t.description === 'string' ? t.description : "",
          durationMin,
          acceptanceCriteria,
        };
      })
      .slice(0, 6);
  }
  
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing enrich-content request");

    const body = await req.json();
    const { topic, subtopic, level } = body;

    if (!topic || !subtopic) {
      return new Response(
        JSON.stringify({ error: 'Topic and subtopic are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prompt focado em conteúdo educativo SEM links externos (que seriam alucinações)
    const prompt = `Você é um assistente educacional especializado. Para o tema "${topic}" e subtópico "${subtopic}" (nível: ${level || 'intermediário'}):

Gere um JSON VÁLIDO com a seguinte estrutura EXATA:

{
  "summary": "Resumo educativo de 2-3 parágrafos explicando o subtópico de forma clara e didática. Inclua conceitos-chave, importância e aplicações práticas.",
  "keyTopics": [
    "Conceito ou tópico importante 1",
    "Conceito ou tópico importante 2",
    "Conceito ou tópico importante 3"
  ],
  "tasks": [
    {
      "title": "Nome da atividade de estudo",
      "description": "Descrição detalhada do que fazer, como fazer e o que aprender",
      "durationMin": 25,
      "acceptanceCriteria": [
        "Critério verificável para saber se completou",
        "Outro critério mensurável"
      ]
    }
  ],
  "studyTips": [
    "Dica prática de estudo 1",
    "Dica prática de estudo 2"
  ]
}

REGRAS OBRIGATÓRIAS:
- NÃO inclua URLs ou links (eles não serão válidos)
- summary: texto rico e educativo de 2-3 parágrafos
- keyTopics: 3-5 conceitos importantes para dominar
- tasks: 3-5 atividades práticas com descrições detalhadas
- durationMin: inteiro entre 5 e 180 minutos
- acceptanceCriteria: 2-3 itens verificáveis (ex: "Consegue explicar X sem consulta")
- studyTips: 2-3 dicas práticas de como estudar melhor o tema
- Retorne APENAS o JSON válido, sem markdown`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "Você é um educador especializado que cria conteúdo didático de alta qualidade. Retorne APENAS JSON válido, sem markdown. NUNCA inclua URLs ou links externos - foque apenas em conteúdo educativo textual." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from AI");
    }

    console.log("Raw AI response:", content.substring(0, 500));

    // Parse e valida a resposta
    let enrichedContent;
    try {
      const cleanContent = extractJsonFromResponse(content);
      const parsed = JSON.parse(cleanContent);
      enrichedContent = validateAndNormalizeResponse(parsed);
      console.log("Successfully parsed and validated AI response");
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, "\nContent:", content);
      // Fallback seguro
      enrichedContent = {
        summary: `Este módulo aborda "${subtopic}" no contexto de ${topic}. Estude os conceitos fundamentais e pratique com exercícios para consolidar o aprendizado.`,
        keyTopics: [subtopic],
        tasks: [
          {
            title: `Estudar ${subtopic}`,
            description: `Dedique tempo para compreender os conceitos básicos de ${subtopic}. Faça anotações e revise o material.`,
            durationMin: 30,
            acceptanceCriteria: ["Compreender os conceitos básicos", "Conseguir explicar com suas palavras"],
          }
        ],
        studyTips: ["Faça pausas regulares", "Pratique ativamente"],
        _fallback: true
      };
    }

    return new Response(
      JSON.stringify(enrichedContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in enrich-content function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
