export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const radLat1 = (Math.PI * lat1) / 180;
  const radLat2 = (Math.PI * lat2) / 180;
  const dLat = radLat2 - radLat1;
  const dLon = (Math.PI * (lon2 - lon1)) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) *
      Math.cos(radLat2) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export const findMatch = (user, filter, location) => {
  const { latitude: lat1, longitude: long1 } = user.location;
  const { latitude: lat2, longitude: long2 } = location;
  let d = calculateDistance(lat1, long1, lat2, long2);
  if (d < 1) d = 1;

  const gender = filter.gender.toLowerCase();

  let interestStatus = user.interests.includes(filter.interest);
  return (gender === "any" || user.gender.toLowerCase() === gender) &&
    (filter.interest.toLowerCase() === "any" || interestStatus) &&
    user.age >= filter.age_min &&
    user.age <= filter.age_max &&
    d >= filter.distance_min &&
    d <= filter.distance_max
    ? d
    : null;
};

export const applyUserQuery = (status, onlineUserIds) => {
  if (status === "Offline" || status === "Both") {
    return [{ $sample: { size: 20 } }];
  }
  return onlineUserIds ? [{ $match: { email: { $in: onlineUserIds } } }] : [];
};

export const attachUserDetails = () => [
  {
    $lookup: {
      from: "attachments",
      let: { userId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$userId", "$$userId"] },
                { $eq: ["$pinned", true] },
              ],
            },
          },
        },
        { $limit: 1 },
      ],
      as: "attachment",
    },
  },
  { $unwind: { path: "$attachment", preserveNullAndEmptyArrays: true } },
  { $match: { attachment: { $exists: true } } },
];

export const attachPlanFeatureDetails = () => [
  {
    $lookup: {
      from: "planfeatures",
      let: { userId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [{ $eq: ["$userId", "$$userId"] }],
            },
          },
        },
        { $project: { hideAge: 1, visibility: 1 } },
        { $limit: 1 },
      ],
      as: "planFeature",
    },
  },
  { $unwind: { path: "$planFeature", preserveNullAndEmptyArrays: true } },
  {
    $match: {
      "planFeature.hideAge": { $exists: true },
      "planFeature.visibility": { $exists: true },
    },
  },
];

export const makeRoom = (user1, user2) => {
  const userIds = [user1, user2].sort();
  return `room_${userIds[0]}_${userIds[1]}`;
};
