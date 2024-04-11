const { Router } = require("express");
const User = require("../models/user");
const { generateToken } = require("../Authentication/index");

const router = Router();

router.post("/signin", async (req, res) => {
  try {
    let { email, password } = req.body;
    console.log(email, password);

    let user = await User.matchPassword(email, password);

    console.log(user);

    if (user.userExisted != true || user.passwordMatched != true) {
      return res.json({
        msg: "invalid Credentials",
        loginStat: false,
      });
    }

    let token = await generateToken({
      _id: user._id,
      email: user.email,
      name: user.name,
    });

    console.log(token);

    return res.cookie("token", token).json({
      msg: "Verified Credentials",
      loginStat: true,
      token: token,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    return res.json({
      msg: "Some Error Occured Try Again",
      loginStat: false,
    });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.create({
      name: name,
      email: email,
      password: password,
    });

    return res.json(user);
  } catch (err) {
    res.json({ existed: true });
  }
});

module.exports = router;
