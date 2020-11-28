import { handleNotifications } from "../../../notifications";
import { socket } from "../socket";

socket.on("Notification.Show", (data: { uuid: string; message: string }) => {
    handleNotifications([data]);
});
