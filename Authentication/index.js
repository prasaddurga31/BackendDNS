const { sign, verify } = require("jsonwebtoken");
const url = require("url");

//secret key to generate Token
const secretKey = "Durga@46576";

//verifying user Token
async function VerifyToken(token) {
  try {
    let result = verify(token, secretKey);
    console.log("verified at auth : ", result);
    return { ...result, isValidToken: true };
  } catch (error) {
    return { isValidToken: false, error };
  }
}

//genertaing Token
async function generateToken(user) {
  let token = sign(user, secretKey, { expiresIn: 86400 });
  return token;
}

//Authentiaction checking Middleware for every rote
async function CheckAuthentication(req, res, next) {
  console.log("Entered");

  let token = req?.body?.token || req?.originalUrl.split("/")[3] || "wrong";

  const result = await VerifyToken(token);

  if (result?.isValidToken == false) {
    return res.json({ TokenStat: false });
  }
  req.userData = result;

  next();
}

module.exports = { VerifyToken, generateToken, CheckAuthentication };
