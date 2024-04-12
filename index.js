const express = require("express");
const { connect } = require("mongoose");
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 8000;
const DNSRouter = require("./routes/dnsRoute");
const userRouter = require("./routes/user");
const url = require("url");
const { CheckAuthentication } = require("./Authentication/index");
const Mongourl =
  "mongodb+srv://prasaddurga2031:1234@cluster0.5hqzz5m.mongodb.net/DNS?retryWrites=true&w=majority&appName=Cluster0";
var cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

app.use(cookieParser());

app.use(cors());
app.use(bodyParser.json());

connect(Mongourl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.log("Failed to Connecte, Error:", err));

app.use("/user", userRouter);
app.use("/DNS", DNSRouter);

app.listen(PORT, () =>
  console.log(`Server Started At Port:${PORT} on ${Date.now()}`)
);
