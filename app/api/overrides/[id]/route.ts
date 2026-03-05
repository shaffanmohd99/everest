import { NextResponse } from "next/server";
import { z } from "zod";
import { Override, type OverrideDoc } from "@/lib/models/Override";
import { jsonError, isDuplicateKeyError } from "@/lib/api-utils";
import { invalidateOverrideCache } from "@/lib/cache/flag-cache";
import { withDb } from "@/lib/with-db";

export const runtime = "nodejs";

const updateOverrideSchema = z.object({
  target: z.string().min(1).max(128).trim().optional(),
  state: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return withDb(async () => {
      const body = await request.json().catch(() => null);
      const parsed = updateOverrideSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError("Invalid payload", 400, z.treeifyError(parsed.error));
      }

      if (!parsed.data.target && typeof parsed.data.state !== "boolean") {
        return jsonError("No changes provided", 400);
      }

      try {
        const updated = await Override.findByIdAndUpdate(id, parsed.data, {
          new: true,
          runValidators: true,
        }).lean<OverrideDoc | null>();

        if (!updated) {
          return jsonError("Override not found", 404);
        }

        invalidateOverrideCache(updated.featureKey);
        return NextResponse.json({ override: updated });
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          return jsonError("Override already exists for target", 409);
        }
        return jsonError("Failed to update override", 500);
      }
    });
  } catch {
    return jsonError("Invalid route parameters", 400);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return withDb(async () => {
      const override = await Override.findByIdAndDelete(id).lean<OverrideDoc | null>();
      if (!override) {
        return jsonError("Override not found", 404);
      }

      invalidateOverrideCache(override.featureKey);
      return NextResponse.json({ deleted: true });
    });
  } catch {
    return jsonError("Invalid route parameters", 400);
  }
}
