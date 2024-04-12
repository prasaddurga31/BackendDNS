const DNS = require("../models/DNS");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

async function ALLDNS(req, res) {
  console.log(req.userData);
  let DNS_ALL = await DNS.find({ userID: req.userData._id });
  console.log(DNS_ALL);
  return res.json(DNS_ALL);
}

async function CreateDNS(req, res) {
  const { DomainName, Type } = req.body;

  console.log(DomainName, req.userData._id);

  let DNS_STAT = await DNS.create({
    DomainName: DomainName,
    Type: Type,
    userID: req.userData._id,
  });

  console.log(DNS_STAT);

  if (DNS_STAT) return res.json({ ...DNS_STAT, Stat: true });
  return res.json({ Stat: false });
}

async function UpdateDNS(req, res) {}

async function DeleteDNS(req, res) {
  let id = req?.originalUrl.split("/")[4];
  console.log("Id : ", id);
  const deletedDNS = await DNS.findByIdAndDelete(id);
  if (!deletedDNS) {
    return res.status(404).json({ delStat: false });
  }
  console.log(deletedDNS);
  return res.json({ ...deletedDNS, delStat: true });
}

module.exports = { CreateDNS, UpdateDNS, DeleteDNS, ALLDNS };
