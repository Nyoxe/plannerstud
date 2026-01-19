import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, Download, Printer, Trophy } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProgressHeaderProps {
  topic: string;
  progress: number;
  onExportPDF: () => void;
  onExportPNG: () => void;
}

export function ProgressHeader({ 
  topic, 
  progress, 
  onExportPDF,
  onExportPNG 
}: ProgressHeaderProps) {
  const navigate = useNavigate();
  const isComplete = progress === 100;

  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b no-print">
      <div className="container max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left section */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="h-8 w-8"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="hidden sm:block">
              <h1 className="text-sm font-semibold truncate max-w-[200px]">
                {topic}
              </h1>
            </div>
          </div>

          {/* Center - Progress */}
          <div className="flex-1 max-w-xs">
            <div className="flex items-center gap-2">
              {isComplete && <Trophy className="h-4 w-4 text-warning animate-pulse-soft" />}
              <Progress value={progress} className="h-2 progress-bar" />
              <span className="text-sm font-medium tabular-nums min-w-[40px]">
                {progress}%
              </span>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onExportPDF}
                  className="h-8 w-8"
                  aria-label="Exportar PDF"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Exportar PDF</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onExportPNG}
                  className="h-8 w-8 opacity-50 cursor-not-allowed"
                  disabled
                  aria-label="Exportar PNG (em breve)"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Exportar PNG (em breve)</TooltipContent>
            </Tooltip>

            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
