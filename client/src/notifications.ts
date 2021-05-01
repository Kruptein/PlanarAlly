import { POSITION, useToast } from "vue-toastification";

const toast = useToast();

export function handleNotifications(data: { uuid: string; message: string }[]): void {
    const readNotifications: string[] = JSON.parse(localStorage.getItem("notifications-read") ?? "[]");

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
    const readNotifications: string[] = JSON.parse(localStorage.getItem("notifications-read") ?? "[]");
    readNotifications.push(uuid);
    localStorage.setItem("notifications-read", JSON.stringify(readNotifications));
}
