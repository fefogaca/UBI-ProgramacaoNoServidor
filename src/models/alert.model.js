const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
      index: true,
    },
    measurementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Measurement",
      default: null,
    },
    severity: {
      type: String,
      enum: ["informativo", "aviso", "critico"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["ativo", "resolvido", "ignorado"],
      default: "ativo",
      index: true,
    },
    message: { type: String, required: true, trim: true },
    ignoredReason: { type: String, default: null, trim: true },
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: String, default: null, trim: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

alertSchema.set("toJSON", {
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    if (ret.batchId) ret.batchId = ret.batchId.toString();
    if (ret.measurementId) ret.measurementId = ret.measurementId.toString();
    delete ret._id;
    return ret;
  },
});

const Alert = mongoose.model("Alert", alertSchema);

module.exports = {
  Alert,
};
