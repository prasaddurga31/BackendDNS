const express = require("express");
const {
  CreateDNS,
  UpdateDNS,
  DeleteDNS,
  ALLDNS,
} = require("../controllers/DNS_DB_Controllers");

const router = express.Router();

router.get("/dns/:token", ALLDNS);

// Defined route for creating a new DNS record
router.post("/dns", CreateDNS);

// Defined route for updating an existing DNS record
router.put("/dns/:recordId", UpdateDNS);

// Defined route for deleting a DNS record
router.delete("/dns/:recordId/:id", DeleteDNS);

module.exports = router;
