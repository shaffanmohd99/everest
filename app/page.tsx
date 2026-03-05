"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const overrideTypes = ["user", "group", "region"] as const;

type FeatureFlag = {
  _id: string;
  key: string;
  defaultState: boolean;
  description?: string;
};

type Override = {
  _id: string;
  featureKey: string;
  type: "user" | "group" | "region";
  target: string;
  state: boolean;
};

export default function AdminPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newKey, setNewKey] = useState("");
  const [newDefault, setNewDefault] = useState("false");
  const [newDescription, setNewDescription] = useState("");

  const [selectedKey, setSelectedKey] = useState("");
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [overrideType, setOverrideType] = useState("user");
  const [overrideTarget, setOverrideTarget] = useState("");
  const [overrideState, setOverrideState] = useState("true");

  const flagKeys = useMemo(() => flags.map((flag) => flag.key), [flags]);

  async function loadFlags() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/flags");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load flags");
      setFlags(data.flags);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load flags");
    } finally {
      setLoading(false);
    }
  }

  async function loadOverrides(key: string) {
    if (!key) return;
    setError(null);
    try {
      const res = await fetch(`/api/flags/${key}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load overrides");
      setOverrides(data.overrides || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load overrides");
    }
  }

  useEffect(() => {
    loadFlags();
  }, []);

  useEffect(() => {
    if (selectedKey) {
      loadOverrides(selectedKey);
    }
  }, [selectedKey]);

  async function handleCreateFlag(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: newKey.trim(),
          defaultState: newDefault === "true",
          description: newDescription.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create flag");
      setNewKey("");
      setNewDescription("");
      await loadFlags();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create flag");
    }
  }

  async function toggleDefault(flag: FeatureFlag) {
    setError(null);
    try {
      const res = await fetch(`/api/flags/${flag.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultState: !flag.defaultState }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update flag");
      await loadFlags();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update flag");
    }
  }

  async function deleteFlag(flag: FeatureFlag) {
    setError(null);
    try {
      const res = await fetch(`/api/flags/${flag.key}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete flag");
      if (selectedKey === flag.key) {
        setSelectedKey("");
        setOverrides([]);
      }
      await loadFlags();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete flag");
    }
  }

  async function createOverride(e: FormEvent) {
    e.preventDefault();
    if (!selectedKey) return;
    setError(null);
    try {
      const res = await fetch(`/api/flags/${selectedKey}/overrides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: overrideType,
          target: overrideTarget.trim(),
          state: overrideState === "true",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create override");
      setOverrideTarget("");
      await loadOverrides(selectedKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create override");
    }
  }

  async function deleteOverride(override: Override) {
    setError(null);
    try {
      const res = await fetch(`/api/overrides/${override._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete override");
      await loadOverrides(override.featureKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete override");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Feature Flag Engine</h1>
          <p className="text-slate-600">
            Minimal admin console for creating flags, managing overrides, and validating precedence.
          </p>
        </header>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Create Feature Flag</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-4" onSubmit={handleCreateFlag}>
              <Input
                placeholder="flag_key"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                required
              />
              <Select value={newDefault} onChange={(e) => setNewDefault(e.target.value)}>
                <option value="true">Default: Enabled</option>
                <option value="false">Default: Disabled</option>
              </Select>
              <Input
                placeholder="Description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
              <Button type="submit">Create</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Flags</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-slate-500">Loading flags...</p>
            ) : flags.length === 0 ? (
              <p className="text-sm text-slate-500">No flags yet. Create one above.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flags.map((flag) => (
                    <TableRow key={flag._id}>
                      <TableCell className="font-medium">{flag.key}</TableCell>
                      <TableCell>{flag.description || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={flag.defaultState ? "success" : "outline"}>
                          {flag.defaultState ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => toggleDefault(flag)}>
                          Toggle Default
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteFlag(flag)}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overrides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="text-xs font-medium uppercase text-slate-500">Feature</label>
                <Select
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                >
                  <option value="">Select a flag</option>
                  {flagKeys.map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-slate-500">Type</label>
                <Select
                  value={overrideType}
                  onChange={(e) => setOverrideType(e.target.value)}
                >
                  {overrideTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-slate-500">State</label>
                <Select
                  value={overrideState}
                  onChange={(e) => setOverrideState(e.target.value)}
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </Select>
              </div>
            </div>

            <form className="grid gap-3 md:grid-cols-3" onSubmit={createOverride}>
              <Input
                placeholder="Target (userId, groupId, region)"
                value={overrideTarget}
                onChange={(e) => setOverrideTarget(e.target.value)}
                required
              />
              <div className="md:col-span-2 flex items-center gap-3">
                <Button type="submit" disabled={!selectedKey}>
                  Add Override
                </Button>
                {!selectedKey ? (
                  <span className="text-xs text-slate-500">Select a flag first.</span>
                ) : null}
              </div>
            </form>

            {selectedKey && overrides.length === 0 ? (
              <p className="text-sm text-slate-500">No overrides for this feature yet.</p>
            ) : null}

            {overrides.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overrides.map((override) => (
                    <TableRow key={override._id}>
                      <TableCell className="capitalize">{override.type}</TableCell>
                      <TableCell>{override.target}</TableCell>
                      <TableCell>
                        <Badge variant={override.state ? "success" : "outline"}>
                          {override.state ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteOverride(override)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button asChild variant="outline">
              <a href="/evaluate">Open Evaluation Page</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
