const mongoose = require("mongoose");

const measurementSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
      index: true,
    },
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    luminosity: { type: Number, required: true },
    sensorId: { type: String, default: null, trim: true },
    measuredAt: { type: Date, required: true, index: true },
    source: {
      type: String,
      enum: ["manual", "sensor"],
      default: "manual",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

measurementSchema.set("toJSON", {
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    if (ret.batchId) ret.batchId = ret.batchId.toString();
    delete ret._id;
    return ret;
  },
});

const Measurement = mongoose.model("Measurement", measurementSchema);

module.exports = {
  Measurement,
};
