import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phone = process.env.TWILIO_PHONE;

const client = new twilio(accountSid, authToken);

const sendOtpToPhone = async (number, otp) => {
  try {
    const message = `Your Glmpse Verification Code is ${otp}`;
    const response = await client.messages.create({
      body: otp,
      from: phone,
      to: number,
    });

    if (response.status === "queued") {
      console.log("Code sent successfully");
      return true;
    } else {
      return false;
    }
  } catch (error) {
    throw new Error(`Error sending code: ${error.message}`);
  }
};

export default sendOtpToPhone;
