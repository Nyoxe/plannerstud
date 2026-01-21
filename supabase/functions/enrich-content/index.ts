import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  resources: Array<{ title: string; url: string; type: string }>;
  tasks?: Array<{
    title: string;
    durationMin: number;
    acceptanceCriteria: string[];
    resources?: string[];
  }>;
} {
  const result: ReturnType<typeof validateAndNormalizeResponse> = {
    summary: "",
    resources: [],
  };
  
  if (typeof data !== 'object' || data === null) {
    throw new Error("Invalid response format");
  }
  
  const obj = data as Record<string, unknown>;
  
  // Summary
  if (typeof obj.summary === 'string') {
    result.summary = obj.summary;
  }
  
  // Resources (formato legado)
  if (Array.isArray(obj.resources)) {
    result.resources = obj.resources
      .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
      .map(r => ({
        title: typeof r.title === 'string' ? r.title : "Recurso",
        url: typeof r.url === 'string' ? r.url : "#",
        type: typeof r.type === 'string' ? r.type : "article"
      }))
      .slice(0, 5);
  }
  
  // Tasks (novo formato com durationMin e acceptanceCriteria)
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
        
        let resources: string[] | undefined;
        if (Array.isArray(t.resources)) {
          resources = t.resources
            .filter((r): r is string => typeof r === 'string')
            .slice(0, 3);
        }
        
        return {
          title: typeof t.title === 'string' ? t.title : "Tarefa",
          durationMin,
          acceptanceCriteria,
          resources
        };
      })
      .slice(0, 10);
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
    const { topic, subtopic, level, mode } = body;

    if (!topic || !subtopic) {
      return new Response(
        JSON.stringify({ error: 'Topic and subtopic are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Novo prompt para JSON estrito com tasks, durationMin e acceptanceCriteria
    const prompt = `Você é um assistente educacional especializado. Para o tema "${topic}" e subtópico "${subtopic}" (nível: ${level || 'intermediário'}):

Gere um JSON VÁLIDO com a seguinte estrutura EXATA (sem markdown, sem texto adicional):

{
  "summary": "Resumo conciso de 2-3 parágrafos sobre o subtópico",
  "resources": [
    {"title": "Nome", "url": "https://...", "type": "article|video|course|documentation"}
  ],
  "tasks": [
    {
      "title": "Nome da tarefa",
      "durationMin": 25,
      "acceptanceCriteria": ["Critério verificável 1", "Critério verificável 2"],
      "resources": ["URL ou nome de recurso"]
    }
  ]
}

REGRAS OBRIGATÓRIAS:
- durationMin: inteiro entre 5 e 180
- acceptanceCriteria: 1 a 3 itens curtos e verificáveis (ex: "Consegue explicar X", "Resolve exercício Y")
- Gere 3-5 tasks relevantes para o subtópico
- Retorne APENAS o JSON, sem markdown ou texto extra`;

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
            content: "Você retorna APENAS JSON válido, sem markdown, sem explicações. Siga exatamente o schema pedido." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 2000,
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
        summary: `Estudo sobre ${subtopic} no contexto de ${topic}.`,
        resources: [],
        tasks: [
          {
            title: `Estudar ${subtopic}`,
            durationMin: 30,
            acceptanceCriteria: ["Compreender os conceitos básicos"],
            resources: []
          }
        ],
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
