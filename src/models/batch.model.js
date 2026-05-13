const mongoose = require("mongoose");

const lossSchema = new mongoose.Schema(
  {
    quantity: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true, trim: true },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const batchSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["ativo", "concluido", "comprometido"],
      required: true,
      default: "ativo",
      index: true,
    },
    planIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CultivationPlan",
      },
    ],
    parentBatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
    },
    initialQuantity: { type: Number, min: 0, default: null },
    yieldKg: { type: Number, min: 0, default: 0 },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, default: null },
    expectedEndAt: { type: Date, default: null },
    losses: { type: [lossSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

batchSchema.set("toJSON", {
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    if (Array.isArray(ret.planIds)) {
      ret.planIds = ret.planIds.map((id) => id.toString());
    }
    if (ret.parentBatchId) {
      ret.parentBatchId = ret.parentBatchId.toString();
    }
    delete ret._id;
    return ret;
  },
});

const Batch = mongoose.model("Batch", batchSchema);

module.exports = {
  Batch,
};
