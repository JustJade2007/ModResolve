import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AnalyzeAndSuggestResult } from "@/lib/actions";

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

export function SolutionDisplay({
  solution,
}: {
  solution: AnalyzeAndSuggestResult;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Root Cause Analysis</CardTitle>
          <CardDescription>
            The AI has identified the following potential root cause for your
            issue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormattedText text={solution.analysis.rootCause} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Potential Solutions</CardTitle>
          <CardDescription>
            Here are some potential solutions to resolve the issue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormattedText text={solution.analysis.potentialSolutions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Steps</CardTitle>
          <CardDescription>
            Follow this step-by-step guide to fix the problem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 font-mono text-sm text-muted-foreground">
            {solution.steps.steps}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
