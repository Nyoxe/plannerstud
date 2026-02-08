import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  BookOpen, 
  Lightbulb, 
  Target, 
  Clock, 
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import type { EnrichedContent } from "@/types/schedule";

interface EnrichedContentSectionProps {
  content?: EnrichedContent;
  onFetch: () => void;
  isLoading: boolean;
}

export function EnrichedContentSection({ content, onFetch, isLoading }: EnrichedContentSectionProps) {
  const [expanded, setExpanded] = useState(false);

  // If no content yet, show the fetch button
  if (!content && !isLoading) {
    return (
      <div className="pt-3 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={onFetch}
          className="w-full gap-2 text-sm"
        >
          <Sparkles className="h-4 w-4" />
          Gerar conteúdo de estudo com IA
        </Button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="pt-3 border-t space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Gerando conteúdo educativo...</span>
        </div>
        <Skeleton className="h-20 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      </div>
    );
  }

  // Error state
  if (content?.error) {
    return (
      <div className="pt-3 border-t">
        <div className="text-sm text-destructive mb-2">{content.error}</div>
        <Button
          variant="outline"
          size="sm"
          onClick={onFetch}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Content loaded
  return (
    <div className="pt-3 border-t space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          Conteúdo de Estudo
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="text-xs h-7 gap-1"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Recolher
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Ver tudo
            </>
          )}
        </Button>
      </div>

      {/* Summary */}
      {content?.summary && (
        <div className={`text-sm text-muted-foreground leading-relaxed ${!expanded ? "line-clamp-3" : ""}`}>
          {content.summary}
        </div>
      )}

      {/* Key Topics */}
      {content?.keyTopics && content.keyTopics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {content.keyTopics.slice(0, expanded ? undefined : 3).map((topic, index) => (
            <Badge key={index} variant="secondary" className="text-xs font-normal">
              <BookOpen className="h-3 w-3 mr-1" />
              {topic}
            </Badge>
          ))}
          {!expanded && content.keyTopics.length > 3 && (
            <Badge variant="outline" className="text-xs font-normal">
              +{content.keyTopics.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Expanded Content */}
      {expanded && (
        <>
          {/* Study Tips */}
          {content?.studyTips && content.studyTips.length > 0 && (
            <div className="space-y-2 bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs font-medium">
                <Lightbulb className="h-3.5 w-3.5 text-accent-foreground" />
                Dicas de Estudo
              </div>
              <ul className="space-y-1">
                {content.studyTips.map((tip, index) => (
                  <li key={index} className="text-xs text-muted-foreground flex gap-2">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tasks */}
          {content?.tasks && content.tasks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium">
                <Target className="h-3.5 w-3.5 text-primary" />
                Atividades Sugeridas
              </div>
              <div className="space-y-2">
                {content.tasks.map((task, index) => (
                  <div 
                    key={index} 
                    className="bg-muted/30 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium">{task.title}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        <Clock className="h-2.5 w-2.5 mr-1" />
                        {task.durationMin} min
                      </Badge>
                    </div>
                    
                    {task.description && (
                      <p className="text-xs text-muted-foreground">
                        {task.description}
                      </p>
                    )}
                    
                    {task.acceptanceCriteria && task.acceptanceCriteria.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] text-muted-foreground font-medium">
                          Critérios de conclusão:
                        </div>
                        <ul className="space-y-0.5">
                          {task.acceptanceCriteria.map((criteria, cIndex) => (
                            <li key={cIndex} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                              {criteria}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Refresh button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onFetch}
        className="gap-2 text-xs h-7"
      >
        <RefreshCw className="h-3 w-3" />
        Regenerar
      </Button>
    </div>
  );
}
