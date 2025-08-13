import {
  Card,
  CardContent,
} from "@/components/ui/card";
import type { GeneralHelpOutput } from "@/ai/flows/general-help";

function FormattedText({ text }: { text: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
      {text.split("\n").map((paragraph, index) => {
        if (paragraph.trim() === "") return null;
        // Basic markdown for bolding with **text**
        const parts = paragraph.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={index} className="text-sm leading-relaxed">
            {parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
}

export function GeneralHelpSolutionDisplay({
  solution,
}: {
  solution: GeneralHelpOutput;
}) {
  return (
      <CardContent className="p-0">
        <FormattedText text={solution.answer} />
      </CardContent>
  );
}
