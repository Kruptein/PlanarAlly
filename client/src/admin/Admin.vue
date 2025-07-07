<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import type { NotificationShow } from "../apiTypes";

import AdminNav from "./AdminNav.vue";
import { socket } from "./socket";
import { AdminSection } from "./types";

const router = useRouter();
const notifications = ref<NotificationShow[]>([]);
const activeSection = ref<AdminSection>(AdminSection.Users);

socket.on("Notifications.List", (data: NotificationShow[]) => (notifications.value = data));

onMounted(() => {
    socket.connect();
});

function add(): void {
    const message = window.prompt("New message:");
    if (message === null) return;
    socket.emit("Notifications.Add", message);
}

async function returnToMainApp(): Promise<void> {
    await router.push("/dashboard");
}
</script>

<template>
    <div class="admin-container">
        <AdminNav v-model:active-section="activeSection" @exit="returnToMainApp" />

        <main class="admin-content">
            <router-view></router-view>
        </main>
        <!-- 
        
            <section v-if="activeSection === AdminSection.Notifications" class="content-section">
                <div class="section-header">
                    <h1>Notifications Management</h1>
                    <button class="add-button" @click="add">
                        <font-awesome-icon icon="plus" />
                        Add Notification
                    </button>
                </div>

                <div class="notifications-list">
                    <div v-if="notifications.length === 0" class="empty-state">
                        <font-awesome-icon icon="bell-slash" class="empty-icon" />
                        <p>No notifications active</p>
                    </div>

                    <div v-else class="notification-items">
                        <div v-for="notification of notifications" :key="notification.uuid" class="notification-item">
                            <div class="notification-content">
                                <font-awesome-icon icon="bell" class="notification-icon" />
                                <span class="notification-message">{{ notification.message }}</span>
                            </div>
                            <div class="notification-actions">
                                <button class="action-button" title="Edit notification">
                                    <font-awesome-icon icon="edit" />
                                </button>
                                <button class="action-button" title="Delete notification">
                                    <font-awesome-icon icon="trash" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main> -->
    </div>
</template>

<style lang="scss">
.admin-container {
    display: flex;
    min-height: 100vh;
    width: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
}

.admin-content {
    flex: 1;
    margin: 2.5rem 2.5rem 2.5rem 0;
    background-color: rgba(77, 59, 64, 0.6);
    border-radius: 20px;
    padding: 3.75rem;
    overflow-y: auto;

    .content-section {
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 5px solid #ffa8bf;

            h1 {
                font-size: 2.5em;
                color: white;
                font-weight: bold;
                margin: 0;
            }

            .add-button {
                background-color: rgba(219, 0, 59, 1);
                border: 2px solid #ffa8bf;
                border-radius: 10px;
                color: white;
                padding: 0.75rem 1.5rem;
                font-size: 1em;
                font-weight: bold;
                cursor: pointer;
                display: flex;
                align-items: center;
                transition: all 0.3s ease;

                &:hover {
                    background-color: #ffa8bf;
                    color: #7c253e;
                    transform: translateY(-2px);
                }

                .nav-icon {
                    margin-right: 0.5rem;
                }
            }
        }

        .notifications-list {
            .empty-state {
                text-align: center;
                padding: 3rem;
                color: #ccc;

                .empty-icon {
                    font-size: 4em;
                    margin-bottom: 1rem;
                    color: #666;
                }

                p {
                    font-size: 1.2em;
                    margin: 0;
                }
            }

            .notification-items {
                display: flex;
                flex-direction: column;
                gap: 1rem;

                .notification-item {
                    background-color: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    padding: 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.3s ease;

                    &:hover {
                        background-color: rgba(255, 255, 255, 0.15);
                        transform: translateX(5px);
                    }

                    .notification-content {
                        display: flex;
                        align-items: center;
                        flex: 1;

                        .notification-icon {
                            color: #ffa8bf;
                            margin-right: 1rem;
                            font-size: 1.2em;
                        }

                        .notification-message {
                            font-size: 1.1em;
                            color: white;
                        }
                    }

                    .notification-actions {
                        display: flex;
                        gap: 0.5rem;

                        .action-button {
                            background-color: rgba(219, 0, 59, 0.5);
                            border: 1px solid rgba(219, 0, 59, 1);
                            border-radius: 5px;
                            color: white;
                            padding: 0.5rem;
                            cursor: pointer;
                            transition: all 0.3s ease;

                            &:hover {
                                background-color: rgba(219, 0, 59, 1);
                                transform: scale(1.1);
                            }
                        }
                    }
                }
            }
        }

        .placeholder-content {
            text-align: center;
            padding: 3rem;
            color: #ccc;

            .placeholder-icon {
                font-size: 4em;
                margin-bottom: 1rem;
                color: #ffa8bf;
            }

            h2 {
                font-size: 2em;
                color: #ffa8bf;
                margin-bottom: 1rem;
            }

            p {
                font-size: 1.1em;
                margin-bottom: 1rem;
                line-height: 1.6;
            }

            ul {
                text-align: left;
                max-width: 400px;
                margin: 0 auto;

                li {
                    margin-bottom: 0.5rem;
                    color: #ddd;
                }
            }
        }
    }
}

// Responsive design
@media (max-width: 768px) {
    .admin-container {
        flex-direction: column;
    }

    .admin-content {
        margin: 1rem;
        padding: 1.5rem;

        .content-section .section-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;

            h1 {
                font-size: 2em;
            }
        }
    }
}
</style>
