const { createHmac, randomBytes } = require("crypto");

const { Schema, model } = require("mongoose");

const DNSSchema = new Schema(
  {
    DomainName: {
      type: String,
      required: true,
      unique: true,
    },
    Type: {
      type: String,
      required: true,
    },
    userID: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  },
  { timestamps: true }
);

const DNS = model("DNS", DNSSchema);

module.exports = DNS;
