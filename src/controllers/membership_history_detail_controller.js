import MembershipAllActivity from "../models/membership_all_activity_model.js";
import MembershipHistory from "../models/membership_history_model.js";
import { setToRedis, getFromRedis } from "../redis/redis_methods.js";
import MembershipPlan from "../models/membership_plan_model.js";
import getFeature, { cancelPlan } from "../methods/plans.js";
import PlanFeature from "../models/plan_features_model.js";
import Payment from "../models/payment_model.js";
import { daysToDate } from "../methods/utils.js";
import expire from "../redis/redis_expire.js";
import User from "../models/user_model.js";
import mongoose from "mongoose";

export const addMembershipHistory = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const {
      userId,
      period,
      planType,
      taxAndFees,
      paymentMode,
      transactionId,
      membershipPlanId,
    } = req.body;
    const membershipKey = `glmpse:${membershipPlanId}`;

    const redisMembership = await getFromRedis(membershipKey);

    const membership =
      redisMembership || (await MembershipPlan.findById(membershipPlanId));

    if (!membership) {
      return res.status(404).json({ error: "Membership Plan not found" });
    }

    await Payment.findOneAndUpdate(
      { userId },
      { expireAt: daysToDate(period) },
      { upsert: true },
      { session }
    );

    const user = await User.findByIdAndUpdate(
      userId,
      { membershipId: membership._id },
      { new: true, session }
    );

    const newMembershipActivity = (
      await MembershipAllActivity.create(
        [
          {
            userId,
            planTitle: membership.title,
            totalAmount: period * membership.price + taxAndFees,
            planType,
          },
        ],
        { session }
      )
    )[0];

    await MembershipHistory.create(
      [
        {
          membershipActivityId: newMembershipActivity._id,
          totalAmount: period * membership.price + taxAndFees,
          planDetail: period,
          name: user.name,
          transactionId,
          paymentMode,
          taxAndFees,
        },
      ],
      { session }
    );

    const planFeature = await getFeature({
      userId,
      membershipId: membershipPlanId,
      forceReset: true,
    });

    console.log("update plan: ", planFeature);

    const userKey = `user:${user.email}`;
    const newObj = user.toObject();
    delete newObj.password;

    const featuresKey = `planFeature:${userId}`;
    await Promise.all([
      setToRedis(membershipKey, membership, expire.glmpse),
      setToRedis(featuresKey, planFeature, expire.planFeature),
      setToRedis(userKey, newObj, expire.user),
    ]);
    await session.commitTransaction();
    res.json("Payment successful");
  } catch (err) {
    console.log(err.message);
    await session.abortTransaction();
    res.status(500).json({ error: err.message });
  } finally {
    await session.endSession();
  }
};

export const getMembershipHistory = async (req, res) => {
  try {
    const { membershipActivityId } = req.params;
    const membershipHistory = await MembershipHistory.findOne({
      membershipActivityId,
    });
    if (!membershipHistory) {
      return res.status(404).json({ error: "Membership History not found" });
    }

    res.json(membershipHistory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMembershipAllActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const membershipActivity = await MembershipAllActivity.find({ userId });
    if (!membershipActivity) {
      return res.status(404).json({ error: "Membership History not found" });
    }

    res.json(membershipActivity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateMembershipHistory = async (req, res) => {
  try {
    const { membershipHistoryId } = req.body;

    const membershipHistory = await MembershipHistory.findByIdAndUpdate(
      membershipHistoryId,
      req.body,
      { new: true }
    );

    if (!membershipHistory) {
      return res.status(404).json({ error: "Membership History not found" });
    }

    await MembershipAllActivity.findOneAndUpdate(
      membershipHistory._id,
      req.body
    );

    res.json("History updated successfully");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//! ----------- cancel membership plan -------------

export const cancelMembership = async (req, res) => {
  try {
    const { userId } = req.body;

    await cancelPlan(userId);

    res.json("Membership cancelled successfully");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//! ----------- plan feature -------------

export const getPlanFeature = async (req, res) => {
  try {
    const { userId, membershipId } = req.body;

    let planFeature = await getFeature({ userId, membershipId });

    res.json(planFeature);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// !----------------------------------------------------------------
export const updatePlanFeature = async (req, res) => {
  try {
    const { planFeature, userId } = req.body;
    const featuresKey = `planFeature:${userId}`;

    console.table(planFeature);

    const p = await PlanFeature.findOneAndUpdate({ userId }, planFeature);
    if (!p) {
      return res.status(400).json({ error: "Couldn't find user plan feature" });
    }

    await setToRedis(featuresKey, planFeature, expire.planFeature);
    res.json({ message: "Plan feature updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.medossage });
  }
};
