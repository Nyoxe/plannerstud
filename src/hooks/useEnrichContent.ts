import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { EnrichedContent } from "@/types/schedule";

interface EnrichContentParams {
  topic: string;
  subtopic: string;
  level: string;
}

export function useEnrichContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enrichContent = useCallback(async (params: EnrichContentParams): Promise<EnrichedContent | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("enrich-content", {
        body: params,
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      return data as EnrichedContent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao buscar conteúdo";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { enrichContent, isLoading, error };
}
