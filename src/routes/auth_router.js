import { Router } from "express";
import {
  getUser,
  sendOtp,
  verifyOtp,
  loginUser,
  updateUser,
  deleteUser,
  signupUser,
  sendPhoneOtp,
  updatePassword,
  getAllUsers,
} from "../controllers/auth_controllers.js";
const authRouter = Router();

authRouter
  .post("/login", loginUser)
  .post("/send_otp", sendOtp)
  .post("/signup", signupUser)
  .post("/verify_otp", verifyOtp)
  .post("/update_user", updateUser)
  .get("/get_user/:email", getUser)
  .get("/get_all_users/users", getAllUsers)
  .post("/send_phone_otp", sendPhoneOtp)
  .get("/delete_user/:email", deleteUser)
  .post("/update_password", updatePassword);

export default authRouter;
