import axios from "axios";
import FormData from "form-data";

const sendOtpEmail = async (email, otp) => {
  const apiUrl = "https://sendmail.minekrypton.com";

  const formData = new FormData();
  formData.append("recipient", email);
  formData.append("code", otp);

  const response = await axios.post(apiUrl, formData, {
    headers: { ...formData.getHeaders() },
  });
  return response;
};

function generateOTP() {
  const min = 1000;
  const max = 9999;

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export { sendOtpEmail, generateOTP };
