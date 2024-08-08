export const secondsToDate = (time) => {
  return new Date(new Date().setSeconds(new Date().getSeconds() + time));
};

export const daysToDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const addPlanFeature = ({ membership }) => {
  const features = {
    sparks: {
      amount: membership.sparks.amount,
      time: secondsToDate(membership.sparks.time),
    },
    superSpark: {
      amount: membership.superSpark.amount,
      time: secondsToDate(membership.superSpark.time),
    },
    freeBoost: {
      duration: membership.freeBoost.duration,
      amount: membership.freeBoost.amount,
      time: secondsToDate(membership.freeBoost.time),
    },
    hideAge: false,
  };
  return features;
};
