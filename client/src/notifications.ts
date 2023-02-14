import { POSITION, useToast } from "vue-toastification";

const toast = useToast();

export function handleNotifications(data: { uuid: string; message: string }[]): void {
    const readNotifications = JSON.parse(localStorage.getItem("notifications-read") ?? "[]") as string[];

    for (const notification of data) {
        if (readNotifications.includes(notification.uuid)) continue;

        toast.warning(notification.message, {
            timeout: false,
            position: POSITION.TOP_LEFT,
            onClose: () => markAsRead(notification.uuid),
        });
    }
}

function markAsRead(uuid: string): void {
    const readNotifications = JSON.parse(localStorage.getItem("notifications-read") ?? "[]") as string[];
    readNotifications.push(uuid);
    localStorage.setItem("notifications-read", JSON.stringify(readNotifications));
}
