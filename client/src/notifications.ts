import Vue from "vue";
import { ToastObject } from "vue-toasted";

export function handleNotifications(data: { uuid: string; message: string }[]): void {
    const readNotifications: string[] = JSON.parse(localStorage.getItem("notifications-read") ?? "[]");

    for (const notification of data) {
        if (readNotifications.includes(notification.uuid)) continue;

        Vue.toasted.show(notification.message, {
            position: "top-left",
            icon: "exclamation",
            action: [
                {
                    text: "close",
                    class: "black",
                    onClick: (e: HTMLElement, t: ToastObject) => {
                        t.goAway(0);
                        markAsRead(notification.uuid);
                    },
                },
            ],
            onComplete: () => {
                markAsRead(notification.uuid);
            },
        });
    }
}

function markAsRead(uuid: string): void {
    const readNotifications: string[] = JSON.parse(localStorage.getItem("notifications-read") ?? "[]");
    readNotifications.push(uuid);
    localStorage.setItem("notifications-read", JSON.stringify(readNotifications));
}
