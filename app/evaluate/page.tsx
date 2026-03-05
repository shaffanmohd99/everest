"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type EvaluationResult = {
  key: string;
  enabled: boolean;
  reason: "user" | "group" | "region" | "default";
  matchedOverride?: {
    type: string;
    target: string;
    state: boolean;
  } | null;
};

export default function EvaluatePage() {
  const [key, setKey] = useState("");
  const [userId, setUserId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [region, setRegion] = useState("");
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEvaluate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: key.trim(),
          userId: userId.trim() || undefined,
          groupId: groupId.trim() || undefined,
          region: region.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to evaluate");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to evaluate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Evaluate Feature Flag</h1>
          <p className="text-slate-600">
            Provide a context and evaluate which rule is used to resolve the flag.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Evaluation Context</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleEvaluate}>
              <Input placeholder="Feature key" value={key} onChange={(e) => setKey(e.target.value)} required />
              <div className="grid gap-4 md:grid-cols-3">
                <Input placeholder="User ID (optional)" value={userId} onChange={(e) => setUserId(e.target.value)} />
                <Input placeholder="Group ID (optional)" value={groupId} onChange={(e) => setGroupId(e.target.value)} />
                <Input placeholder="Region (optional)" value={region} onChange={(e) => setRegion(e.target.value)} />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Evaluating..." : "Evaluate"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {result ? (
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">State</span>
                <Badge variant={result.enabled ? "success" : "outline"}>
                  {result.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="text-sm text-slate-700">
                <span className="font-medium">Reason:</span> {result.reason}
              </div>
              {result.matchedOverride ? (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  Matched {result.matchedOverride.type} override for target {result.matchedOverride.target}
                </div>
              ) : (
                <div className="text-sm text-slate-500">No override matched. Using global default.</div>
              )}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Back to Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <a href="/">Go to Admin Dashboard</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
