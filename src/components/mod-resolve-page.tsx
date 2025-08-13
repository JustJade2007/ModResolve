"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { analyzeAndSuggest, generalHelpAction } from "@/lib/actions";
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
import type { FormState, GeneralHelpFormState } from "@/lib/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralHelpSolutionDisplay } from "./general-help-solution-display";

const initialAnalyzeState: FormState = {
  result: null,
  error: null,
};

const initialHelpState: GeneralHelpFormState = {
  result: null,
  error: null,
};

function SubmitButton({ text }: { text: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Analyzing...
        </>
      ) : (
        text
      )}
    </Button>
  );
}

export function ModResolvePage() {
  const [analyzeState, analyzeAction] = useActionState(
    analyzeAndSuggest,
    initialAnalyzeState
  );
  const [helpState, helpAction] = useActionState(
    generalHelpAction,
    initialHelpState
  );

  return (
    <div className="w-full max-w-3xl space-y-8">
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">
            Minecraft Bug Fixer
          </CardTitle>
          <CardDescription>
            Use the tabs below to either analyze an error log or ask a general
            question.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="analyze">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analyze">Analyze Error Log</TabsTrigger>
              <TabsTrigger value="help">General Help</TabsTrigger>
            </TabsList>
            <TabsContent value="analyze" className="mt-6">
              <form action={analyzeAction} className="space-y-6">
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
                        <SelectItem value="NeoForge">NeoForge</SelectItem>
                        <SelectItem value="Vanilla">Vanilla</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <SubmitButton text="Analyze Log" />
              </form>
            </TabsContent>
            <TabsContent value="help" className="mt-6">
              <form action={helpAction} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="question" className="text-base">
                    Your Question
                  </Label>
                  <Textarea
                    id="question"
                    name="question"
                    placeholder="Describe the issue you're facing or the change you want to make..."
                    className="min-h-[200px]"
                    required
                  />
                </div>
                <SubmitButton text="Get Help" />
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {analyzeState.error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">An Error Occurred</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{analyzeState.error}</p>
          </CardContent>
        </Card>
      )}

      {analyzeState.result && <SolutionDisplay solution={analyzeState.result} />}

      {helpState.error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">An Error Occurred</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{helpState.error}</p>
          </CardContent>
        </Card>
      )}

      {helpState.result && (
        <GeneralHelpSolutionDisplay solution={helpState.result} />
      )}
    </div>
  );
}
