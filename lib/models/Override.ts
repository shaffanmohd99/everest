import { Schema, model, models } from "mongoose";

export type OverrideType = "user" | "group" | "region";

export type OverrideDoc = {
  featureKey: string;
  type: OverrideType;
  target: string;
  state: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

const OverrideSchema = new Schema<OverrideDoc>(
  {
    featureKey: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["user", "group", "region"],
    },
    target: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);

OverrideSchema.index({ featureKey: 1, type: 1, target: 1 }, { unique: true });

export const Override = models.Override || model("Override", OverrideSchema);
