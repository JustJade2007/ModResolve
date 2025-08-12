"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { analyzeAndSuggest } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SolutionDisplay } from "./solution-display";
import { Loader2 } from "lucide-react";
import type { FormState } from "@/lib/actions";

const initialState: FormState = {
  result: null,
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Analyzing...
        </>
      ) : (
        "Analyze Log"
      )}
    </Button>
  );
}

export function ModResolvePage() {
  const [state, formAction] = useActionState(analyzeAndSuggest, initialState);

  return (
    <div className="w-full max-w-3xl space-y-8">
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">
            Minecraft Bug Fixer
          </CardTitle>
          <CardDescription>
            Paste your error log, provide some details, and let AI find a
            solution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="errorLog" className="text-base">
                Error Log
              </Label>
              <Textarea
                id="errorLog"
                name="errorLog"
                placeholder="Paste your full Minecraft error log here..."
                className="min-h-[200px] font-mono text-xs"
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minecraftVersion" className="text-base">
                  Minecraft Version
                </Label>
                <Input
                  id="minecraftVersion"
                  name="minecraftVersion"
                  placeholder="e.g., 1.20.1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modloader" className="text-base">
                  Modloader
                </Label>
                <Select name="modloader" defaultValue="Vanilla" required>
                  <SelectTrigger id="modloader">
                    <SelectValue placeholder="Select modloader" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Forge">Forge</SelectItem>
                    <SelectItem value="Fabric">Fabric</SelectItem>
                    <SelectItem value="Quilt">Quilt</SelectItem>
                    <SelectItem value="Vanilla">Vanilla</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SubmitButton />
          </form>
        </CardContent>
      </Card>

      {state.error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">An Error Occurred</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{state.error}</p>
          </CardContent>
        </Card>
      )}

      {state.result && <SolutionDisplay solution={state.result} />}
    </div>
  );
}
