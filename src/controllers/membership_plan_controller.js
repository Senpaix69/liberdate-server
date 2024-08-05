import MembershipPlan from "../models/membership_plan_model.js";
import expire from "../redis/redis_expire.js";
import User from "../models/user_model.js";
import {
  setToRedis,
  getFromRedis,
  deleteFromRedis,
  getListFromRedis,
  setListFromRedis,
  deleteFromRedisByPattern,
} from "../redis/redis_methods.js";

export const addMembershipPlan = async (req, res) => {
  try {
    const { email } = req.body;
    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);

    const user = redisUser || (await User.findOne({ email }));
    if (!user || user.status !== "admin" || user.isBan) {
      return res.status(400).json({ error: "Only admin can do CRUD OP." });
    }
    const newMembershipPlan = await MembershipPlan.create({
      ...req.body,
      adminId: user._id,
    });

    const membershipPlanKey = `glmpse:${newMembershipPlan._id}`;

    await Promise.all([
      setToRedis(membershipPlanKey, newMembershipPlan, expire.glmpse),
      setToRedis(key, redisUser, expire.user),
    ]);

    res.json(newMembershipPlan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMembershipPlan = async (req, res) => {
  try {
    const { membershipPlanId } = req.params;
    const key = `glmpse:${membershipPlanId}`;
    const redisMembershipPlan = await getFromRedis(key);
    const membershipPlan =
      redisMembershipPlan || (await MembershipPlan.findById(membershipPlanId));
    if (!membershipPlan) {
      return res.status(404).json({ error: "Membership Plan not found" });
    }
    await setToRedis(key, membershipPlan, expire.glmpse);

    res.json(membershipPlan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateMembershipPlan = async (req, res) => {
  try {
    const { membershipPlanId, email } = req.body;

    const key = `user:${email}`;
    const redisUser = await getFromRedis(key);

    const user = redisUser || (await User.findOne({ email }));
    if (!user || user.status !== "admin" || user.isBan) {
      return res.status(400).json({ error: "Only admin can do CRUD OP." });
    }

    const membershipPlan = await MembershipPlan.findByIdAndUpdate(
      membershipPlanId,
      req.body,
      {
        new: true,
      }
    );

    if (!membershipPlan) {
      return res.status(404).json({ error: "Membership Plan not found" });
    }

    const membershipPlankey = `glmpse:${membershipPlanId}`;

    await Promise.all([
      setToRedis(membershipPlankey, membershipPlan, expire.glmpse),
      setToRedis(key, user, expire.user),
    ]);

    res.json(membershipPlan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteMembershipPlan = async (req, res) => {
  try {
    const { membershipPlanId } = req.params;

    const isUsing = await User.findOne({ membershipId: membershipPlanId });
    if (isUsing) {
      return res.status(400).json({
        error: "Deletion Failed. User has subscribed to this membership",
      });
    }

    const membershipPlankey = `glmpse:${membershipPlanId}`;
    const deleteOB = await MembershipPlan.findByIdAndDelete(membershipPlanId);
    if (!deleteOB) {
      return res.status(400).json({ error: "Membership Plans not found" });
    }
    await deleteFromRedis(membershipPlankey);
    res.json({ message: "Membership Plan deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllMembershipPlans = async (_, res) => {
  try {
    const precached = await getListFromRedis("glmpse");
    const total = await MembershipPlan.countDocuments();

    let membershipPlans = precached;
    if (precached?.length !== total) {
      console.log("Membership Plans From Db");
      membershipPlans = await MembershipPlan.find();
      await deleteFromRedisByPattern("glmpse");
      await setListFromRedis("glmpse", membershipPlans, expire.glmpse);
    }

    res.json(membershipPlans);
  } catch (err) {
    res.status(500).json({ error: err.medossage });
  }
};

export const deleteAllMembershipPlans = async (_, res) => {
  try {
    await Promise.all([
      MembershipPlan.deleteMany(),
      deleteFromRedisByPattern("glmpse"),
    ]);
    res.json("Deleted Successfully");
  } catch (err) {
    res.status(500).json({ error: err.medossage });
  }
};
