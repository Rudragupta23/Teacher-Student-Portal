const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const GB_SENDER_ID = "MATHCOMMNTR";
const AWS_REGION = process.env.AWS_REGION || "eu-west-2";

console.log("[SMS CONFIG]", {
  region: AWS_REGION,
  senderId: GB_SENDER_ID,
  hasKey: !!process.env.AWS_ACCESS_KEY_ID,
});

const snsClient = new SNSClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const toE164 = (raw) => {
  if (!raw) return null;
  let p = String(raw).replace(/[\s\-().]/g, "");
  p = p.replace(/^0044/, "+44").replace(/^0091/, "+91");
  if (/^07\d{9}$/.test(p)) p = `+44${p.slice(1)}`;
  if (/^[6-9]\d{9}$/.test(p)) p = `+91${p}`;
  p = p.replace(/^\+440/, "+44").replace(/^\+910/, "+91");
  return /^\+[1-9]\d{7,14}$/.test(p) ? p : null;
};

const GSM7 =
  /^[A-Za-z0-9@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà\n\r^{}\\[~\]|€]*$/;

const sanitise = (text) =>
  String(text || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

const segmentCount = (text) => {
  const unicode = !GSM7.test(text);
  const limit = unicode ? 70 : 160;
  const multi = unicode ? 67 : 153;
  return text.length <= limit ? 1 : Math.ceil(text.length / multi);
};

const sendSMS = async ({ phone, message }) => {
  const to = toE164(phone);
  if (!to) {
    console.error(`[SMS] Invalid number, not sent: ${phone}`);
    return { ok: false, reason: "INVALID_NUMBER", phone };
  }

  const body = sanitise(message);
  if (!body) return { ok: false, reason: "EMPTY_MESSAGE", phone: to };

  const attributes = {
    "AWS.SNS.SMS.SMSType": {
      DataType: "String",
      StringValue: "Transactional",
    },
  };

  if (to.startsWith("+44")) {
    attributes["AWS.SNS.SMS.SenderID"] = {
      DataType: "String",
      StringValue: GB_SENDER_ID,
    };
  }

  const segments = segmentCount(body);

  console.log(
    `[SMS] Sending to ${to} | senderId=${
      attributes["AWS.SNS.SMS.SenderID"]?.StringValue || "none"
    } | region=${AWS_REGION} | ${segments} seg`
  );

  try {
    const res = await snsClient.send(
      new PublishCommand({
        Message: body,
        PhoneNumber: to,
        MessageAttributes: attributes,
      })
    );
    console.log(`[SMS] Queued to ${to} id=${res.MessageId}`);
    return { ok: true, messageId: res.MessageId, segments, phone: to };
  } catch (error) {
    console.error(`[SMS] Failed to ${to}: ${error.name} - ${error.message}`);
    return { ok: false, reason: error.name, phone: to };
  }
};

module.exports = sendSMS;