const mongoose = require("mongoose");

const rangeSchema = new mongoose.Schema(
  {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
  },
  { _id: false }
);

const irrigationSchema = new mongoose.Schema(
  {
    frequencyHours: { type: Number, required: true, min: 1 },
    amountMl: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const fertilizationSchema = new mongoose.Schema(
  {
    frequencyDays: { type: Number, required: true, min: 1 },
    dosage: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const approvalSchema = new mongoose.Schema(
  {
    approvedBy: { type: String, required: true, trim: true },
    approvedAt: { type: Date, required: true },
    notes: { type: String, trim: true, default: null },
  },
  { _id: false }
);

const cultivationPlanSchema = new mongoose.Schema(
  {
    herbId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Herb",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["regular", "emergencia", "pontual"],
      required: true,
      index: true,
    },
    regularConfig: {
      temperature: { type: rangeSchema, required: false },
      humidity: { type: rangeSchema, required: false },
      luminosity: { type: rangeSchema, required: false },
      irrigation: { type: irrigationSchema, required: false },
      fertilization: { type: fertilizationSchema, required: false },
      expectedDurationDays: { type: Number, required: false, min: 1 },
    },
    emergencyConfig: {
      minIntervalMinutes: { type: Number, required: false, min: 1 },
      interventionType: { type: String, required: false, trim: true },
      intensityOrDosage: { type: String, required: false, trim: true },
    },
    pontualConfig: {
      interventionType: { type: String, required: false, trim: true },
      intensityOrDosage: { type: String, required: false, trim: true },
      approval: { type: approvalSchema, required: false },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

cultivationPlanSchema.set("toJSON", {
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    ret.herbId = ret.herbId ? ret.herbId.toString() : ret.herbId;
    delete ret._id;
    return ret;
  },
});

const CultivationPlan = mongoose.model("CultivationPlan", cultivationPlanSchema);

module.exports = {
  CultivationPlan,
};
