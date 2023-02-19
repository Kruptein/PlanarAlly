import type { NotificationShow } from "../../../apiTypes";
import { handleNotifications } from "../../../notifications";
import { socket } from "../socket";

socket.on("Notification.Show", (data: NotificationShow) => {
    handleNotifications([data]);
});
