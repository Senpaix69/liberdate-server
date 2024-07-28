import {
  getListFromRedis,
  setListFromRedis,
  deleteFromRedis,
  getFromRedis,
  setToRedis,
  getSetFromRedis,
} from "../redis/redis_methods.js";
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import Otp from "../models/otp_model.js";
import User from "../models/user_model.js";
import getFeature from "../methods/plans.js";
import expire from "../redis/redis_expire.js";
import Payment from "../models/payment_model.js";
import sendOtpToPhone from "../clients/twilio_client.js";
import PlanFeature from "../models/plan_features_model.js";
import MembershipPlan from "../models/membership_plan_model.js";
import { sendOtpEmail, generateOTP } from "../methods/send_otp.js";

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);
    const user = redisUser || (await User.findOne({ email }));

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const authentic = await bcryptjs.compare(password, user.password);
    if (!authentic) {
      return res.status(400).json({ error: "Invalid password" });
    }

    await setToRedis(key, user, expire.user);
    const currentUser = redisUser ? user : user.toObject();
    delete currentUser.password;

    res.json(currentUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const signupUser = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const { email, password, isRegister } = req.body;

    const key = `user:${email}`;
    const [redisUser, redisMemberships] = await Promise.all([
      getFromRedis(key),
      getListFromRedis("glmpse"),
    ]);

    let user = redisUser || (await User.findOne({ email }));
    if (user && isRegister) {
      return res.status(400).json({ error: "Email is already in use" });
    }

    const allMemberships = redisMemberships || (await MembershipPlan.find());

    let planFeature;
    if (!user) {
      const filtered = allMemberships?.filter((mem) => mem.price === 0);
      // if (filtered.length === 0) {
      //   return res.status(400).json({ error: "Couln't find free membership" });
      // }

      const username = email.split("@")[0];
      const hashedPassword = await bcryptjs.hash(password, 8);
      const freeMembership = filtered[0];
      user = (
        await User.create(
          [
            {
              ...req.body,
              username,
              password: hashedPassword,
              // membershipId: freeMembership._id,
            },
          ],
          { session }
        )
      )[0];

      // planFeature = await getFeature({
      //   userId: user._id,
      //   membershipId: freeMembership._id,
      // });

      if (!user) {
        return res.status(400).json({ error: "Failed to register user" });
      }
    } else {
      planFeature =
        (await getFromRedis(`planFeature:${user._id}`)) ||
        (await PlanFeature.findOne({ userId: user._id }));
    }

    await Promise.all([
      // setToRedis(`planFeature:${user._id}`, planFeature, expire.planFeature),
      setListFromRedis("glmpse", allMemberships, expire.glmpse),
      setToRedis(key, user, expire.user),
    ]);

    const userObj = redisUser || user.toObject();
    delete userObj.password;

    await session.commitTransaction();
    res.json(userObj);
  } catch (err) {
    console.log(err.message);
    await session.abortTransaction();
    res.status(500).json({ error: err.message });
  } finally {
    await session.endSession();
  }
};

export const updateUser = async (req, res) => {
  try {
    const { email, newEmail, highlights } = req.body;
    const userEmail = newEmail || email;

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { ...highlights, email: userEmail },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const key = `user:${userEmail}`;
    await deleteFromRedis(`user:${email}`);
    await setToRedis(key, updatedUser, expire.user);

    const userObj = updatedUser.toObject();
    delete userObj.password;

    res.json(userObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { email, password, oldPassword } = req.body;

    const key = `user:${email}`;
    if (oldPassword && oldPassword.length > 0) {
      const redisUser = await getFromRedis(key);
      const user = redisUser || (await User.findOne({ email }));

      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      const authentic = await bcryptjs.compare(oldPassword, user.password);
      if (!authentic) {
        return res.status(400).json({ error: "Invalid Current Password" });
      }
    }

    const hashed = await bcryptjs.hash(password, 8);
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { password: hashed },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    await setToRedis(key, updatedUser, expire.user);
    res.json("Password updated successfully");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const email = req.params.email;
    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);

    const user = redisUser || (await User.findOne({ email }));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await setToRedis(key, user, expire.user);
    const userObj = redisUser || user.toObject();
    delete userObj.password;

    res.json(userObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { email } = req.params;
    const key = `user:${email}`;

    const user = await User.findOneAndDelete({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await deleteFromRedis(key);

    return res.json("User deleted successfully");
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: "Failed to delete user" });
  }
};

export const sendOtp = async (req, res) => {
  try {
    const { email, method } = req.body;
    const otpKey = `otp:${email}`;
    const key = `user:${email}`;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const promises = await Promise.all([
      getFromRedis(key),
      deleteFromRedis(otpKey),
    ]);
    const redisUser = promises[0];

    const existUser = redisUser || (await User.findOne({ email }));
    if (method === "reset") {
      if (!existUser) {
        return res.status(400).json({ error: "Email not found" });
      }
    } else {
      if (existUser) {
        return res.status(400).json({ error: "Email is already in use" });
      }
    }

    const code = generateOTP();
    const response = await sendOtpEmail(email, code);

    if (response.status !== 200) {
      return res.status(400).json({ error: `Error sending code to ${email}` });
    }

    const otp = new Otp(email, code);
    await setToRedis(otpKey, otp, expire.otp);
    console.table(otp);

    res.json("Code send successfully");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const sendPhoneOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    const otpKey = `otp:${phone}`;

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    await deleteFromRedis(otpKey);
    const code = generateOTP();
    // const status = await sendOtpToPhone(phone, code);

    // if (!status) {
    //   return res.status(400).json({ error: `Error sending code to ${phone}` });
    // }

    const otp = new Otp(phone, code);
    await setToRedis(otpKey, otp, expire.otp);
    console.table(otp);

    res.json("Code send successfully");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const otpKey = `otp:${email}`;
    const redisOtp = await getFromRedis(otpKey);
    if (!redisOtp) {
      return res
        .status(400)
        .json({ error: "Code expired please request a new code" });
    }

    // if (redisOtp.code.toString() !== otp) {
    //   return res.status(400).json({ error: "Invalid Code" });
    // }

    await deleteFromRedis(otpKey);
    res.json("Code verified");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//? ------------- filter users for admin -------------

export const getAllUsers = async (req, res) => {
  try {
    const {
      subscription,
      page = 1,
      limit = 20,
      search,
      country,
      gender,
      status,
    } = req.query;
    const query = { status: { $ne: "admin" } };

    // Status filter
    if (status) {
      const onlineUsers = await getSetFromRedis("online_users");
      if (status === "online") {
        query.email = { $in: onlineUsers };
      } else if (status === "offline") {
        query.email = { $nin: onlineUsers };
      }
    }

    // Search filter
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { name: regex },
        { email: regex },
        { username: regex },
        { "phone.number": regex },
      ];
    }

    // Country filter
    if (country) {
      query["phone.country"] = country;
    }

    // Gender filter
    if (gender) {
      query.gender = gender;
    }

    let countPromise, usersPromise, payments;

    if (subscription) {
      countPromise = Payment.countDocuments();
      payments = await Payment.find()
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .sort({ updatedAt: -1 });

      const paymentIds = payments.map((pay) => pay.userId);
      usersPromise = User.find({ _id: { $in: paymentIds } }).populate(
        "membershipId"
      );
    } else {
      countPromise = User.countDocuments(query);
      usersPromise = User.find(query)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .sort({ createdAt: -1 });
    }

    const [totalUsers, users] = await Promise.all([countPromise, usersPromise]);
    const totalPages = Math.ceil(totalUsers / limit);

    if (subscription) {
      const paymentsMap = payments.reduce((map, payment) => {
        map[payment.userId.toString()] = payment;
        return map;
      }, {});

      users.forEach((user) => {
        user._doc.payment = paymentsMap[user._id.toString()] || null;
      });
    }

    res.json({
      users,
      totalPages,
      totalUsers,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
