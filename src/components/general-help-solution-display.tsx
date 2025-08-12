import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { GeneralHelpOutput } from "@/ai/flows/general-help";

function FormattedText({ text }: { text: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
      {text.split("\n").map((paragraph, index) => {
        if (paragraph.trim() === "") return null;
        return (
          <p key={index} className="text-sm leading-relaxed">
            {paragraph}
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Suggested Solution</CardTitle>
          <CardDescription>
            Based on your question, here is a suggested solution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormattedText text={solution.answer} />
        </CardContent>
      </Card>
    </div>
  );
}
