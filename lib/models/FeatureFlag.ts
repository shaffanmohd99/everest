import { Schema, model, models } from "mongoose";

export type FeatureFlagDoc = {
  key: string;
  defaultState: boolean;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

const FeatureFlagSchema = new Schema<FeatureFlagDoc>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    defaultState: {
      type: Boolean,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const FeatureFlag = models.FeatureFlag || model("FeatureFlag", FeatureFlagSchema);
