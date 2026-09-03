// const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

// const snsClient = new SNSClient({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// const sendSMS = async ({ phone, message }) => {
//   try {
//     if (!phone) return; 

//     // const params = {
//     //   Message: message,
//     //   PhoneNumber: phone, 
//     //   MessageAttributes: {
//     //     'AWS.SNS.SMS.SMSType': {
//     //       DataType: 'String',
//     //       StringValue: 'Transactional' 
//     //     },
//     //     'AWS.SNS.SMS.SenderID': {
//     //       DataType: 'String',
//     //       StringValue: 'MATHCOM' 
//     //     }
//     //   }
//     // };

//     const params = {
//       Message: message,
//       PhoneNumber: phone, 
//       MessageAttributes: {
//         'AWS.SNS.SMS.SMSType': {
//           DataType: 'String',
//           StringValue: 'Transactional' 
//         }
//       }
//     };

//     const command = new PublishCommand(params);
//     const response = await snsClient.send(command);
    
//     console.log(`✅ SMS sent successfully to ${phone}`);
    
//     return response;
//   } catch (error) {
//     console.error(`❌ SMS Failed to send to ${phone}:`, error.message);
//   }
// };

// module.exports = sendSMS;

const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const snsClient = new SNSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Country codes you currently have a working SNS route for.
// Add "+44" here only after you register a UK sender ID or buy a UK long code.
const SUPPORTED_PREFIXES = ["+91", "+44"];

const sendSMS = async ({ phone, message }) => {
  if (!phone) return { success: false, reason: "no_phone" };

  const to = String(phone).replace(/[\s()-]/g, "");

  if (!/^\+[1-9]\d{7,14}$/.test(to)) {
    console.warn(`⚠️  SMS skipped — not E.164 format: ${phone}`);
    return { success: false, reason: "not_e164", phone };
  }

  if (!SUPPORTED_PREFIXES.some((p) => to.startsWith(p))) {
    console.warn(`⏭️  SMS skipped for ${to} — no origination identity for this country`);
    return { success: false, reason: "unsupported_country", phone: to };
  }

  try {
    const response = await snsClient.send(
      new PublishCommand({
        Message: message,
        PhoneNumber: to,
        MessageAttributes: {
          "AWS.SNS.SMS.SMSType": {
            DataType: "String",
            StringValue: "Transactional",
          },
        },
      })
    );

    console.log(`✅ SMS accepted by SNS for ${to} (${response.MessageId})`);
    return { success: true, messageId: response.MessageId };
  } catch (error) {
    console.error(`❌ SMS failed for ${to}: ${error.name} — ${error.message}`);
    return { success: false, reason: error.name, phone: to };
  }
};

module.exports = sendSMS;