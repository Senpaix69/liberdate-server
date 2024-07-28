import mongoose from "mongoose";
import {
  getFromRedis,
  getListFromRedis,
  setListFromRedis,
  setToRedis,
} from "../redis/redis_methods.js";
import User from "../models/user_model.js";
import { addPlanFeature } from "./utils.js";
import expire from "../redis/redis_expire.js";
import Payment from "../models/payment_model.js";
import PlanFeature from "../models/plan_features_model.js";
import MembershipPlan from "../models/membership_plan_model.js";

export const cancelPlan = async (userId) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    let redisGlmpse = await getListFromRedis("glmpse");

    const allGlmpse = redisGlmpse || (await MembershipPlan.find());
    const filtered = allGlmpse?.filter((mem) => mem.price === 0);
    if (filtered.length === 0) {
      return res.status(400).json({ error: "Couln't find free membership" });
    }

    const freeMembership = filtered[0];

    const planFeature = await PlanFeature.findOneAndUpdate(
      { userId },
      addPlanFeature({ membership: freeMembership }),
      { new: true, upsert: true, session }
    );

    const user = await User.findByIdAndUpdate(
      userId,
      { membershipId: freeMembership._id },
      { new: true, session }
    );

    await Payment.findOneAndDelete({ userId }, { session });

    const userKey = `user:${user.email}`;
    const planFeatureKey = `planFeature:${userId}`;

    await Promise.all([
      setToRedis(userKey, newObj, expire.user),
      setToRedis(planFeatureKey, planFeature, expire.planFeature),
    ]);

    const newObj = user.toObject();
    delete newObj.password;

    await session.commitTransaction();
    return planFeature;
  } catch (err) {
    await session.abortTransaction();
    throw new Error(err);
  } finally {
    await session.endSession();
  }
};

export const getFeature = async ({
  userId,
  membershipId,
  forceReset = false,
}) => {
  console.log("Calling Get Feature");
  console.log("userId", userId);
  console.log("membershipId", membershipId);
  console.log("Force Reset", forceReset);

  const planFeatureKey = `planFeature:${userId}`;
  const timestamp = Date.now();
  console.log("current time: ", new Date(timestamp));
  let [featureData, memberships, payment] = await Promise.all([
    getFromRedis(planFeatureKey),
    getListFromRedis("glmpse"),
    Payment.findOne({ userId }),
  ]);

  const allMemberships = memberships || (await MembershipPlan.find());
  let curMembership = allMemberships?.filter(
    (e) => e._id.toString() === membershipId?.toString()
  );
  if (curMembership.length === 0) return;
  curMembership = curMembership[0];

  console.group("Feature Data");
  try {
    featureData = featureData || (await PlanFeature.findOne({ userId }).lean());

    if (!featureData || forceReset) {
      console.log("Resetting feature data");
      featureData = await PlanFeature.findOneAndUpdate(
        { userId },
        addPlanFeature({ membership: curMembership }),
        { upsert: true, new: true }
      );

      console.log("Feature from Database", featureData);
    } else if (payment && timestamp > new Date(payment.expireAt)) {
      featureData = await cancelPlan(userId);
    } else if (
      (curMembership?.sparks?.amount !== -1 &&
        timestamp > new Date(featureData?.sparks?.time)) ||
      (curMembership?.superSpark?.amount &&
        timestamp > new Date(featureData?.superSpark?.time)) ||
      (curMembership?.freeBoost?.amount &&
        timestamp > new Date(featureData?.freeBoost?.time))
    ) {
      console.log("Updating feature data");
      featureData = {
        sparks: calculateRemTimes({
          timestamp,
          feature: featureData?.sparks,
          featureData: curMembership?.sparks,
        }),
        superSpark: calculateRemTimes({
          timestamp,
          feature: featureData?.superSpark,
          featureData: curMembership?.superSpark,
        }),
        freeBoost: {
          duration: featureData?.freeBoost?.duration,
          ...calculateRemTimes({
            timestamp,
            feature: featureData?.freeBoost,
            featureData: curMembership?.freeBoost,
          }),
        },
      };

      console.log("feature data to update: ", featureData);

      featureData = await PlanFeature.findOneAndUpdate(
        { userId },
        featureData,
        { new: true }
      );
    }

    await Promise.all([
      setToRedis(planFeatureKey, featureData, expire.planFeature),
      setListFromRedis("glmpse", allMemberships, expire.membership),
    ]);

    console.log("Feature after update", featureData);
  } catch (error) {
    console.error("Error in getFeature:", error);
    throw error;
  } finally {
    console.groupEnd();
  }

  return featureData;
};

export default getFeature;

const calculateRemTimes = ({ timestamp, feature, featureData }) => {
  let { time, amount } = feature;

  console.log(new Date(time));
  time = new Date(time);

  if (timestamp > time) {
    console.log("feature: ", feature);

    let difference = timestamp - time;
    console.log("difference: ", difference);

    let differenceInSeconds = Math.floor(difference / 1000);

    let remainingSeconds = differenceInSeconds % featureData.time;

    let secondsToAdd = featureData.time - remainingSeconds;

    console.log("secondsToAdd: ", secondsToAdd);

    return {
      time: !featureData.time
        ? timestamp
        : new Date(new Date().getTime() + secondsToAdd * 1000),
      amount: featureData.amount,
    };
  } else {
    console.log("feature not expired: ", feature);
    return feature;
  }
};
