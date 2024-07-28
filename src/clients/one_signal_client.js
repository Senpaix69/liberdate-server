import * as OneSignal from "@onesignal/node-onesignal";

const configuration = OneSignal.createConfiguration({
  userAuthKey: process.env.ONESIGNAL_USER_KEY,
  restApiKey: process.env.ONESIGNAL_API_KEY,
});

const APP_ID = process.env.ONESIGNAL_APP_ID;
const client = new OneSignal.DefaultApi(configuration);

export const createNotification = async (message) => {
  try {
    const notification = new OneSignal.Notification();
    console.log(message);

    notification.contents = { en: message.text };
    notification.headings = { en: message.username };
    notification.thread_id = message.sender;
    notification.target_channel = "push";
    notification.app_id = APP_ID;
    notification.data = message;

    notification.small_icon = "ic_stat_onesignal_default";
    notification.huawei_big_picture = message.userProfile;
    notification.big_picture = message.userProfile;
    notification.large_icon = message.userProfile;

    notification.include_aliases = {
      external_id: [message.recipient],
    };

    const notificationResponse = await client.createNotification(notification);
    console.table(notificationResponse);
  } catch (error) {
    console.error("Error creating notification:", error.message);
  }
};
