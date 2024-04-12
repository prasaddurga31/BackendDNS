const mongoose = require("mongoose");

const hostedZoneSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    hostedZoneId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const HostedZone = mongoose.model("HostedZone", hostedZoneSchema);

module.exports = HostedZone;
