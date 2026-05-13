const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["rega", "fertilizacao", "colheita", "monitorizacao"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pendente", "concluida"],
      default: "pendente",
      index: true,
    },
    scheduledAt: { type: Date, required: true },
    executedAt: { type: Date, default: null },
    executedBy: { type: String, default: null, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

taskSchema.set("toJSON", {
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    if (ret.batchId) ret.batchId = ret.batchId.toString();
    delete ret._id;
    return ret;
  },
});

const Task = mongoose.model("Task", taskSchema);

module.exports = {
  Task,
};
