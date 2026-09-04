const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

// Region MUST match where the origination identity lives (eu-west-2).
const snsClient = new SNSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Normalise to E.164.
 * Fixes the "+4407880285012" bug seen in CloudWatch: country code followed
 * by the national trunk prefix "0", which is never valid in E.164.
 */
const toE164 = (raw) => {
  if (!raw) return null;

  let p = String(raw).replace(/[\s\-().]/g, "");

  p = p.replace(/^0044/, "+44").replace(/^0091/, "+91");

  if (/^07\d{9}$/.test(p)) p = `+44${p.slice(1)}`;   // 07733794525
  if (/^[6-9]\d{9}$/.test(p)) p = `+91${p}`;          // bare Indian mobile

  p = p.replace(/^\+440/, "+44").replace(/^\+910/, "+91");

  return /^\+[1-9]\d{7,14}$/.test(p) ? p : null;
};

/**
 * Billing is per segment: 160 chars on GSM-7, but a single non-GSM character
 * (emoji, curly quote, en dash) drops the whole message to 70 chars/segment.
 */
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
  if (!body) {
    return { ok: false, reason: "EMPTY_MESSAGE", phone: to };
  }

  const attributes = {
    "AWS.SNS.SMS.SMSType": {
      DataType: "String",
      StringValue: "Transactional",
    },
  };

  // UK only. India routes over ILDO and ignores sender IDs entirely.
  if (to.startsWith("+44") && process.env.SNS_GB_SENDER_ID) {
    attributes["AWS.SNS.SMS.SenderID"] = {
      DataType: "String",
      StringValue: process.env.SNS_GB_SENDER_ID, // MATHCOMMNTR
    };
  }

  const segments = segmentCount(body);
  if (segments > 2) {
    console.warn(`[SMS] ${segments} segments to ${to} - consider shortening`);
  }

  try {
    const res = await snsClient.send(
      new PublishCommand({
        Message: body,
        PhoneNumber: to,
        MessageAttributes: attributes,
      })
    );

    console.log(`[SMS] Queued to ${to} (${segments} seg) id=${res.MessageId}`);
    return { ok: true, messageId: res.MessageId, segments, phone: to };
  } catch (error) {
    console.error(`[SMS] Failed to ${to}: ${error.name} - ${error.message}`);
    return { ok: false, reason: error.name, phone: to };
  }
};

module.exports = sendSMS;