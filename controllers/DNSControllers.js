const AWS = require("aws-sdk");
AWS.config.update({
  region: "your-region", // Specify your AWS region
  accessKeyId: "your-access-key-id",
  secretAccessKey: "your-secret-access-key",
});

const route53 = new AWS.Route53();

async function CreateDNS(req, res) {
  try {
    const { userId } = req.params;
    const { domain, type, value } = req.body;

    // Validate request body
    if (!domain || !type || !value) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Assuming you have a database where you store user's domains and DNS records
    const user = await User.findById(userId);

    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let hostedZoneId = user.hostedZoneId;

    // If user doesn't have a hosted zone ID, create one
    if (!hostedZoneId) {
      // Create hosted zone using AWS SDK
      const createHostedZoneParams = {
        Name: "example.com", // Replace with user's domain
        CallerReference: `create-hosted-zone-${userId}`,
        // CallerReference must be unique for each request to create a new hosted zone
      };

      const hostedZone = await route53
        .createHostedZone(createHostedZoneParams)
        .promise();

      hostedZoneId = hostedZone.HostedZone.Id;

      // Update user record in the database with the new hosted zone ID
      user.hostedZoneId = hostedZoneId;
      await user.save();
    }

    // Construct params for Route 53
    const params = {
      HostedZoneId: user.hostedZoneId,
      ChangeBatch: {
        Changes: [
          {
            Action: "CREATE",
            ResourceRecordSet: {
              Name: domain,
              Type: type,
              TTL: 300,
              ResourceRecords: [{ Value: value }],
            },
          },
        ],
      },
    };

    // Call AWS Route 53 to create DNS record
    await route53.changeResourceRecordSets(params).promise();

    return res.status(201).json({ message: "DNS record created successfully" });
  } catch (error) {
    console.error("Error creating DNS record:", error);
    return res.status(500).json({ message: "Failed to create DNS record" });
  }
}

async function UpdateDNS(req, res) {
  try {
    const { userId, recordId } = req.params;
    const { domain, type, value } = req.body;

    // Validate request body
    if (!domain || !type || !value) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Assuming you have a database where you store user's domains and DNS records
    const user = await User.findById(userId);

    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Construct params for Route 53
    const params = {
      HostedZoneId: user.hostedZoneId,
      ChangeBatch: {
        Changes: [
          {
            Action: "UPSERT",
            ResourceRecordSet: {
              Name: domain,
              Type: type,
              TTL: 300,
              ResourceRecords: [{ Value: value }],
            },
          },
        ],
      },
    };

    // Call AWS Route 53 to update DNS record
    await route53.changeResourceRecordSets(params).promise();

    return res.status(200).json({ message: "DNS record updated successfully" });
  } catch (error) {
    console.error("Error updating DNS record:", error);
    return res.status(500).json({ message: "Failed to update DNS record" });
  }
}

async function DeleteDNS(req, res) {
  try {
    const { userId, recordId } = req.params;

    // Assuming you have a database where you store user's domains and DNS records
    const user = await User.findById(userId);

    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Construct params for Route 53
    const params = {
      HostedZoneId: user.hostedZoneId,
      ChangeBatch: {
        Changes: [
          {
            Action: "DELETE",
            ResourceRecordSet: {
              Name: domain,
              Type: type,
            },
          },
        ],
      },
    };

    // Call AWS Route 53 to delete DNS record
    await route53.changeResourceRecordSets(params).promise();

    return res.status(200).json({ message: "DNS record deleted successfully" });
  } catch (error) {
    console.error("Error deleting DNS record:", error);
    return res.status(500).json({ message: "Failed to delete DNS record" });
  }
}

module.exports = { CreateDNS, UpdateDNS, DeleteDNS };
