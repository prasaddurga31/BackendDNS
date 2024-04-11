const express = require("express");
const {
  CreateDNS,
  UpdateDNS,
  DeleteDNS,
} = require("../controllers/DNSControllers");

const router = express.Router();

// Define route for creating a new DNS record
router.post("/dns/:userId", CreateDNS);

// Define route for updating an existing DNS record
router.put("/dns/:userId/:recordId", UpdateDNS);

// Define route for deleting a DNS record
router.delete("/dns/:userId/:recordId", DeleteDNS);

module.exports = router;
