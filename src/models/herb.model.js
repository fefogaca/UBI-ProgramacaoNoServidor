const mongoose = require("mongoose");

const herbSchema = new mongoose.Schema(
  {
    commonName: {
      type: String,
      required: true,
      trim: true,
    },
    scientificName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

herbSchema.set("toJSON", {
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

const Herb = mongoose.model("Herb", herbSchema);

module.exports = {
  Herb,
};
