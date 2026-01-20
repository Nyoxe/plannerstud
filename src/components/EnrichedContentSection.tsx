import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ExternalLink, BookOpen, Video, FileText, GraduationCap, RefreshCw } from "lucide-react";
import type { EnrichedContent, Resource } from "@/types/schedule";

interface EnrichedContentSectionProps {
  content?: EnrichedContent;
  onFetch: () => void;
  isLoading: boolean;
}

const resourceIcons: Record<Resource["type"], React.ReactNode> = {
  article: <FileText className="h-3.5 w-3.5" />,
  video: <Video className="h-3.5 w-3.5" />,
  course: <GraduationCap className="h-3.5 w-3.5" />,
  documentation: <BookOpen className="h-3.5 w-3.5" />,
};

const resourceLabels: Record<Resource["type"], string> = {
  article: "Artigo",
  video: "Vídeo",
  course: "Curso",
  documentation: "Documentação",
};

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
          Gerar resumo e recursos com IA
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
          <span>Buscando conteúdo...</span>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          Conteúdo IA
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="text-xs h-7"
        >
          {expanded ? "Recolher" : "Expandir"}
        </Button>
      </div>

      {content?.summary && (
        <div className={`text-sm text-muted-foreground ${!expanded ? "line-clamp-2" : ""}`}>
          {content.summary}
        </div>
      )}

      {expanded && content?.resources && content.resources.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Recursos recomendados:</div>
          <div className="space-y-1.5">
            {content.resources.map((resource, index) => (
              <a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors group"
              >
                <div className="text-muted-foreground">
                  {resourceIcons[resource.type] || <FileText className="h-3.5 w-3.5" />}
                </div>
                <span className="text-sm flex-1 truncate group-hover:text-primary transition-colors">
                  {resource.title}
                </span>
                <Badge variant="secondary" className="text-[10px] h-5">
                  {resourceLabels[resource.type] || resource.type}
                </Badge>
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onFetch}
        className="gap-2 text-xs h-7"
      >
        <RefreshCw className="h-3 w-3" />
        Atualizar
      </Button>
    </div>
  );
}
