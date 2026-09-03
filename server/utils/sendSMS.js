const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const snsClient = new SNSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const sendSMS = async ({ phone, message }) => {
  try {
    if (!phone) return; 

    // const params = {
    //   Message: message,
    //   PhoneNumber: phone, 
    //   MessageAttributes: {
    //     'AWS.SNS.SMS.SMSType': {
    //       DataType: 'String',
    //       StringValue: 'Transactional' 
    //     },
    //     'AWS.SNS.SMS.SenderID': {
    //       DataType: 'String',
    //       StringValue: 'MATHCOM' 
    //     }
    //   }
    // };

    const params = {
      Message: message,
      PhoneNumber: phone, 
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional' 
        }
      }
    };

    const command = new PublishCommand(params);
    const response = await snsClient.send(command);
    
    console.log(`✅ SMS sent successfully to ${phone}`);
    
    return response;
  } catch (error) {
    console.error(`❌ SMS Failed to send to ${phone}:`, error.message);
  }
};

module.exports = sendSMS;