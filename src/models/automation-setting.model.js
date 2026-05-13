const mongoose = require("mongoose");

const automationSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "global",
    },
    mode: {
      type: String,
      enum: ["manual", "automatico"],
      required: true,
      default: "manual",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

automationSettingSchema.set("toJSON", {
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

const AutomationSetting = mongoose.model("AutomationSetting", automationSettingSchema);

module.exports = {
  AutomationSetting,
};
