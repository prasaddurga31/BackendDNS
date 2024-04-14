const express = require("express");
const multer = require("multer");
const upload = multer();
const {
  createUserHostedZone,
  listUserHostedZones,
  deleteUserHostedZone,
  createDNSRecordsFromCSV,
  createDNSRecordsFromJSON,
  deleteDNSRecords,
  listHostedZoneRecords,
  createDNSRecordsFromUI,
} = require("../controllers/DNSControllers");

const router = express.Router();

router.get("/dns", listUserHostedZones);

router.get("/dns/records", listHostedZoneRecords);

// creating HositedZone
router.post("/dns", createUserHostedZone);

// creating new records from UI
router.post("/dns/ui", createDNSRecordsFromUI);

// creating new records from CSV file
router.post("/dns/csv", createDNSRecordsFromCSV);

// creating new records from JSON file
router.post("/dns/json", upload.single("file"), createDNSRecordsFromJSON);

// Define route for deleting a Hoisted Zone
router.delete("/dns", deleteUserHostedZone);

// Define route for deleting a DNS record
router.delete("/dns/record", deleteDNSRecords);

module.exports = router;
