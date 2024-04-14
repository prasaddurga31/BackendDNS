const AWS = require("aws-sdk");
const csv = require("csv-parser");
const fs = require("fs");
const multer = require("multer");
const HostedZoneModel = require("../models/HosistedZones");

const upload = multer();

AWS.config.update({
  accessKeyId: "AKIASKYFIKG5SJPWDL4W",
  secretAccessKey: "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",
  region: "ap-south-1",
});

const route53 = new AWS.Route53();

async function listHostedZoneRecords(req, res) {
  const hostedZoneId = req.query.hostedZoneId;

  console.log("id : ", req.query);
  try {
    const params = {
      HostedZoneId: hostedZoneId,
    };

    const response = await route53.listResourceRecordSets(params).promise();
    const records = response.ResourceRecordSets;
    console.log(records);
    res.json(records);
  } catch (error) {
    console.error("Error listing hosted zone records:", error);
    res.json(error);
  }
}

async function listUserHostedZones(req, res) {
  try {
    const userId = req.query.userId;
    console.log(userId);
    // Fetch hosted zones directly from AWS Route 53
    const hostedZonesResponse = await route53.listHostedZones().promise();
    const hostedZones = hostedZonesResponse.HostedZones;

    // Filter hosted zones associated with the user
    const userHostedZones = [];
    for (const zone of hostedZones) {
      if (zone.Config.Comment == `user-${userId}`) {
        console.log("true");
        userHostedZones.push(zone);
      }
    }

    console.log("All ZOnes: ", hostedZones);
    console.log("User Zones : ", userHostedZones);

    // Return the hosted zones associated with the user
    res.json(userHostedZones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

async function createUserHostedZone(req, res) {
  let { userId, domainName } = req.body;
  console.log(userId, domainName);
  try {
    domainName += ".";
    console.log(domainName);
    // Check if the user already has a hosted zone with the same domain name
    const existingHostedZone = await HostedZoneModel.find({
      name: domainName,
    });

    console.log("existed: ", existingHostedZone);

    if (existingHostedZone.length != 0) {
      throw new Error(
        "Hosted zone with the same domain already exists for the user"
      );
    }

    // Create hosted zone for the user
    const callerReference = `user-${userId}-hosted-zone-${Date.now()}`;
    const comment = `user-${userId}`;
    const params = {
      CallerReference: callerReference,
      Name: domainName,
      HostedZoneConfig: {
        Comment: comment,
      },
    };

    const response = await route53.createHostedZone(params).promise();

    // Save the hosted zone information to the database
    const { HostedZone } = response;
    const { Id, Name } = HostedZone;

    const hostedZone = new HostedZoneModel({
      userId,
      hostedZoneId: Id,
      name: Name,
    });

    const savedHostedZone = await hostedZone.save();
    console.log("Hosted zone saved:", savedHostedZone);

    res.json({ ...response, Stat: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

async function deleteUserHostedZone(req, res) {
  const { userId, hostedZoneId } = req.query;

  try {
    // Check if the user has permission to delete the hosted zone
    console.log("id: ", hostedZoneId);
    const hostedZone = await HostedZoneModel.find({ hostedZoneId });
    console.log("Hoisted Zone in deleete: ", hostedZone);
    if (!hostedZone) {
      throw new Error("User does not existed");
    }

    // Delete all non-required records from the hosted zone first
    await deleteNonRequiredRecords(hostedZoneId);

    // Once all non-required records are deleted, delete the hosted zone
    const params = {
      Id: hostedZoneId,
    };

    const response = await route53.deleteHostedZone(params).promise();

    // Remove the hosted zone association from the user's list in the database
    const ress = await HostedZoneModel.findByIdAndDelete(hostedZone[0]._id);
    console.log("ress: ", ress);

    console.log(response);
    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

async function deleteNonRequiredRecords(hostedZoneId) {
  try {
    const listParams = {
      HostedZoneId: hostedZoneId,
    };
    const recordSets = await route53
      .listResourceRecordSets(listParams)
      .promise();

    // Filter out the NS and SOA records
    const nonRequiredRecords = recordSets.ResourceRecordSets.filter(
      (record) => !["NS", "SOA"].includes(record.Type)
    );

    // Prepare changes to delete non-required records
    const changes = nonRequiredRecords.map((record) => ({
      Action: "DELETE",
      ResourceRecordSet: record,
    }));

    // If there are no non-required records, return without making any changes
    if (changes.length === 0) {
      console.log("No non-required records to delete.");
      return;
    }

    const params = {
      HostedZoneId: hostedZoneId,
      ChangeBatch: {
        Changes: changes,
      },
    };

    await route53.changeResourceRecordSets(params).promise();
  } catch (error) {
    console.error("Error deleting non-required records:", error);
    throw error;
  }
}

async function changeDNSRecords(hostedZoneId, changes) {
  try {
    const params = {
      HostedZoneId: hostedZoneId,
      ChangeBatch: {
        Changes: changes,
      },
    };

    const response = await route53.changeResourceRecordSets(params).promise();
    console.log("response: ", response);
    return response;
  } catch (error) {
    console.error(error);
    return error;
  }
}

function parseCSVFile(filePath) {
  const records = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => records.push(data))
      .on("end", () => resolve(records))
      .on("error", (error) => reject(error));
  });
}

async function createDNSRecordsFromCSV(req, res) {
  const { hostedZoneId, filePath } = req.body; // Correct the destructuring
  try {
    const records = await parseCSVFile(filePath);
    const changes = records.map((record) => ({
      Action: "UPSERT",
      ResourceRecordSet: {
        Name: record.name,
        Type: record.type,
        TTL: record.ttl || 300,
        ResourceRecords: [{ Value: record.value }],
      },
    }));
    await changeDNSRecords(hostedZoneId, changes);
    res.json({ message: "DNS records created successfully" }); // Send success response
  } catch (error) {
    console.error(error);
    res.json({ error: error.message }); // Send error response
  }
}

async function createDNSRecordsFromJSON(req, res) {
  // console.log(req.body);

  const fileData = req.file.buffer.toString("utf8");
  const jsonData = JSON.parse(fileData);

  // console.log(jsonData);

  const hostedZoneId = jsonData.hostedZoneId;
  const records = jsonData.records;
  try {
    const changes = records.map((record) => ({
      Action: "UPSERT",
      ResourceRecordSet: {
        Name: record.name,
        Type: record.type,
        TTL: record.ttl || 300,
        ResourceRecords: [{ Value: record.value }],
      },
    }));
    await changeDNSRecords(hostedZoneId, changes);

    res.json({ message: "DNS records created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

async function createDNSRecordsFromUI(req, res) {
  try {
    const { name, Type, TTL, value, hostedZoneId } = req.body;
    console.log(req.body);
    console.log(req.query);
    const changeParams = {
      ChangeBatch: {
        Changes: [
          {
            Action: "UPSERT",
            ResourceRecordSet: {
              Name: name,
              Type: Type,
              TTL: TTL || 300,
              ResourceRecords: [
                {
                  Value: value,
                },
              ],
            },
          },
        ],
      },
      HostedZoneId: hostedZoneId,
    };

    const data = await route53.changeResourceRecordSets(changeParams).promise();
    console.log("Record created successfully:", data);
    res.json({ message: "Record created successfully", data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

async function deleteDNSRecords(req, res) {
  console.log("Body is :", req.body);
  // const { hostedZoneId, recordName, recordType } = req.query;
  const hostedZoneId = req.query.hostedZoneId;
  const recordType = req.body.Type;
  const recordName = req.body.Name;
  const recordTTL = req.body.TTL;
  const resourceRecord = req.body.ResourceRecords;

  console.log(hostedZoneId, recordName, recordType);
  try {
    const params = {
      HostedZoneId: hostedZoneId,
      ChangeBatch: {
        Changes: [
          {
            Action: "DELETE",
            ResourceRecordSet: {
              Name: recordName,
              Type: recordType,
              TTL: recordTTL,
              ResourceRecords: resourceRecord,
            },
          },
        ],
      },
    };

    const response = await route53.changeResourceRecordSets(params).promise();
    console.log("DNS record deleted successfully:", response);
    res.json({ message: "DNS record deleted successfully" });
  } catch (error) {
    console.error("Error deleting DNS record:", error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listUserHostedZones,
  createUserHostedZone,
  deleteUserHostedZone,
  createDNSRecordsFromCSV,
  createDNSRecordsFromJSON,
  deleteDNSRecords,
  listHostedZoneRecords,
  createDNSRecordsFromUI,
};
