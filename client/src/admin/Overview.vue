<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { socket } from "./socket";
import type { AdminOverview } from "./types";

const overview = ref<AdminOverview>();
const loading = ref(true);
const failed = ref(false);

const maxDailyActivity = computed(() => {
    if (overview.value === undefined) return 0;
    return Math.max(
        0,
        ...overview.value.dailyActivity.flatMap((day) => [
            day.newUsers,
            day.newCampaigns,
            day.activeCampaigns,
            day.connectedPlayers,
            day.sessions,
        ]),
    );
});

async function load(): Promise<void> {
    loading.value = true;
    failed.value = false;
    try {
        overview.value = (await socket.emitWithAck("Stats.Overview")) as AdminOverview;
        failed.value = overview.value === undefined;
    } catch {
        failed.value = true;
    } finally {
        loading.value = false;
    }
}

function barHeight(value: number): string {
    if (value === 0 || maxDailyActivity.value === 0) return "0";
    return `${Math.max(6, (value / maxDailyActivity.value) * 100)}%`;
}

function formatDate(value: Date, includeYear: boolean): string {
    const parts = new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        year: includeYear ? "numeric" : undefined,
    }).formatToParts(value);
    const part = (type: Intl.DateTimeFormatPartTypes): string =>
        parts.find((datePart) => datePart.type === type)?.value ?? "";
    return [part("day"), part("month"), includeYear ? part("year") : undefined].filter(Boolean).join(" ");
}

function formatDay(value: string): string {
    return formatDate(new Date(`${value}T00:00:00`), false);
}

function formatDateTime(value: string | null): string {
    if (value === null) return "Never";
    const date = new Date(value);
    const time = new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
    return `${formatDate(date, true)}, ${time}`;
}

onMounted(load);
</script>

<template>
    <section class="content-section">
        <div class="section-header">
            <div>
                <h1>Server Overview</h1>
                <p>Local server usage and telemetry health</p>
            </div>
            <button class="add-button" :disabled="loading" @click="load">
                <font-awesome-icon icon="sync-alt" />
                Refresh
            </button>
        </div>

        <div v-if="loading" class="status-message">Loading server statistics…</div>
        <div v-else-if="failed || overview === undefined" class="status-message error">
            Server statistics could not be loaded.
        </div>

        <template v-else>
            <div class="stats-grid">
                <article class="stat-card">
                    <span class="stat-label">Users</span>
                    <strong>{{ overview.totals.users }}</strong>
                    <small>{{ overview.totals.activeUsers }} active in the last 30 days</small>
                </article>
                <article class="stat-card">
                    <span class="stat-label">Campaigns</span>
                    <strong>{{ overview.totals.campaigns }}</strong>
                    <small>{{ overview.totals.memberships }} player memberships</small>
                </article>
                <article class="stat-card">
                    <span class="stat-label">New users</span>
                    <strong>{{ overview.activity.newUsers }}</strong>
                    <small>Last 30 days</small>
                </article>
                <article class="stat-card">
                    <span class="stat-label">New campaigns</span>
                    <strong>{{ overview.activity.newCampaigns }}</strong>
                    <small>Last 30 days</small>
                </article>
                <article class="stat-card">
                    <span class="stat-label">Player sessions</span>
                    <strong>{{ overview.activity.sessions }}</strong>
                    <small>Last 30 days; reconnects within 5 minutes are merged</small>
                </article>
            </div>

            <div class="overview-panels">
                <article class="panel activity-panel">
                    <div class="panel-heading">
                        <div>
                            <h2>Activity</h2>
                            <p>Last 14 days</p>
                        </div>
                        <div class="legend">
                            <span class="new-users">New users</span>
                            <span class="new-campaigns">New campaigns</span>
                            <span class="active-campaigns">Active campaigns</span>
                            <span class="connected-players">Connected players</span>
                            <span class="sessions">Sessions</span>
                        </div>
                    </div>

                    <div v-if="maxDailyActivity === 0" class="empty-activity">No tracked activity in this period.</div>
                    <div v-else class="activity-chart">
                        <div v-for="day in overview.dailyActivity" :key="day.date" class="day">
                            <div class="bars">
                                <div
                                    class="bar new-users"
                                    :style="{ height: barHeight(day.newUsers) }"
                                    :title="`${day.newUsers} new users`"
                                ></div>
                                <div
                                    class="bar new-campaigns"
                                    :style="{ height: barHeight(day.newCampaigns) }"
                                    :title="`${day.newCampaigns} new campaigns`"
                                ></div>
                                <div
                                    class="bar active-campaigns"
                                    :style="{ height: barHeight(day.activeCampaigns) }"
                                    :title="`${day.activeCampaigns} active campaigns`"
                                ></div>
                                <div
                                    class="bar connected-players"
                                    :style="{ height: barHeight(day.connectedPlayers) }"
                                    :title="`${day.connectedPlayers} connected players`"
                                ></div>
                                <div
                                    class="bar sessions"
                                    :style="{ height: barHeight(day.sessions) }"
                                    :title="`${day.sessions} player sessions`"
                                ></div>
                            </div>
                            <span>{{ formatDay(day.date) }}</span>
                        </div>
                    </div>
                </article>

                <article class="panel telemetry-panel">
                    <h2>Telemetry</h2>
                    <dl>
                        <div>
                            <dt>Collection</dt>
                            <dd :class="{ enabled: overview.telemetry.enabled }">
                                {{ overview.telemetry.enabled ? "Enabled" : "Disabled" }}
                            </dd>
                        </div>
                        <div>
                            <dt>Export</dt>
                            <dd :class="{ enabled: overview.telemetry.exportEnabled }">
                                {{ overview.telemetry.exportEnabled ? "Enabled" : "Disabled" }}
                            </dd>
                        </div>
                        <div>
                            <dt>Pending events</dt>
                            <dd>{{ overview.telemetry.pendingEvents }}</dd>
                        </div>
                        <div>
                            <dt>Last export</dt>
                            <dd>{{ formatDateTime(overview.telemetry.lastExport) }}</dd>
                        </div>
                        <div>
                            <dt>Server started</dt>
                            <dd>{{ formatDateTime(overview.telemetry.serverStarted) }}</dd>
                        </div>
                    </dl>
                </article>
            </div>
        </template>
    </section>
</template>

<style scoped lang="scss">
.section-header {
    p {
        color: #ccc;
        margin: 0.4rem 0 0;
    }

    .add-button {
        gap: 0.6rem;

        &:disabled {
            cursor: wait;
            opacity: 0.6;
        }
    }
}

.status-message {
    padding: 3rem;
    text-align: center;
    color: #ccc;

    &.error {
        color: #ffa8bf;
    }
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.stat-card,
.panel {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 168, 191, 0.25);
    border-radius: 12px;
}

.stat-card {
    display: flex;
    flex-direction: column;
    padding: 1.25rem;

    .stat-label {
        color: #ffa8bf;
        font-weight: bold;
    }

    strong {
        font-size: 2.2rem;
        line-height: 1.2;
        margin: 0.25rem 0;
    }

    small {
        color: #ccc;
    }
}

.overview-panels {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(15rem, 1fr);
    gap: 1rem;
}

.panel {
    padding: 1.25rem;

    h2 {
        margin: 0;
    }
}

.panel-heading {
    display: flex;
    justify-content: space-between;
    gap: 1rem;

    p {
        color: #ccc;
        margin: 0.25rem 0 0;
    }
}

.legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    font-size: 0.8rem;

    span::before {
        content: "";
        display: inline-block;
        width: 0.65rem;
        height: 0.65rem;
        border-radius: 2px;
        margin-right: 0.3rem;
    }
}

.activity-chart {
    display: grid;
    grid-template-columns: repeat(14, minmax(1.5rem, 1fr));
    gap: 0.35rem;
    min-height: 13rem;
    margin-top: 1rem;
}

.day {
    display: flex;
    flex-direction: column;
    min-width: 0;

    > span {
        color: #bbb;
        font-size: 0.65rem;
        margin-top: 0.4rem;
        overflow: hidden;
        text-align: center;
        white-space: nowrap;
    }
}

.bars {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 2px;
    flex: 1;
    border-bottom: 1px solid rgba(255, 255, 255, 0.25);
}

.bar {
    width: 17%;
    min-height: 0;
    border-radius: 3px 3px 0 0;
    transition: height 0.2s ease;
}

.new-users,
.new-users::before {
    background-color: #ffa8bf;
}

.new-campaigns,
.new-campaigns::before {
    background-color: #ffcf70;
}

.active-campaigns,
.active-campaigns::before {
    background-color: #b99cff;
}

.connected-players,
.connected-players::before {
    background-color: #7ec8ff;
}

.sessions,
.sessions::before {
    background-color: #77d6c9;
}

.legend span {
    background: transparent;
}

.empty-activity {
    color: #bbb;
    min-height: 12rem;
    display: grid;
    place-items: center;
}

.telemetry-panel dl {
    margin: 1rem 0 0;

    div {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.7rem 0;
        border-bottom: 1px dashed rgba(255, 255, 255, 0.25);
    }

    dt {
        color: #ccc;
    }

    dd {
        margin: 0;
        text-align: right;
        overflow-wrap: anywhere;

        &.enabled {
            color: #77d6c9;
        }
    }
}

@media (max-width: 1000px) {
    .overview-panels {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .activity-chart {
        overflow-x: auto;
        grid-template-columns: repeat(14, minmax(2rem, 1fr));
    }

    .panel-heading {
        flex-direction: column;
    }
}
</style>
