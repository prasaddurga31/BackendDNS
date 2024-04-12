const { createHmac, randomBytes } = require("crypto");

const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    salt: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", function (next) {
  const user = this;

  //creating a key to hash the password
  const slat = randomBytes(16).toString();

  //generated a hased passord using the key and Sha256 alogorithm
  const hashedPassword = createHmac("sha256", slat)
    .update(user.password)
    .digest("hex");

  //added the modified values to user object before Saving
  this.salt = slat;
  this.password = hashedPassword;

  //called the next process
  next();
});

userSchema.static("matchPassword", async function (email, passord) {
  const user = await this.findOne({ email });

  if (!user) return { userExisted: false };

  const salt = user.salt;
  const hashedpassword = user.password;

  const UserGeneartedhash = createHmac("sha256", salt)
    .update(passord)
    .digest("hex");

  if (hashedpassword != UserGeneartedhash) {
    console.log("password wrong");
    return { userExisted: true, passwordMatched: false };
  } else {
    return {
      ...user._doc,
      passord: null,
      salt: null,
      userExisted: true,
      passwordMatched: true,
    };
  }
});

const User = model("user", userSchema);

module.exports = User;
