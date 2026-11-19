<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import BarChart from "./BarChart.vue";
import { socket } from "./socket";
import type { AdminOverview, DailyActivity } from "./types";

const colors = {
    playTime: "#77d6c9",
    players: "#7ec8ff",
    campaigns: "#b99cff",
    newUsers: "#ffa8bf",
    newCampaigns: "#ffcf70",
};

const overview = ref<AdminOverview>();
const loading = ref(true);
const failed = ref(false);

const dayLabels = computed(() => overview.value?.dailyActivity.map((day) => formatDay(day.date)) ?? []);

function daily(key: Exclude<keyof DailyActivity, "date">): number[] {
    return overview.value?.dailyActivity.map((day) => day[key]) ?? [];
}

const maxPlayTime = computed(() => Math.max(0, ...(overview.value?.dailyActivity.map((day) => day.playTime) ?? [])));
const maxUsage = computed(() =>
    Math.max(0, ...(overview.value?.dailyActivity.flatMap((day) => [day.connectedPlayers, day.activeCampaigns]) ?? [])),
);
const maxGrowth = computed(() =>
    Math.max(0, ...(overview.value?.dailyActivity.flatMap((day) => [day.newUsers, day.newCampaigns]) ?? [])),
);

async function load(): Promise<void> {
    loading.value = true;
    failed.value = false;
    try {
        // The server groups the chart per day in the admin's timezone
        const utcOffsetMinutes = -new Date().getTimezoneOffset();
        overview.value = (await socket.emitWithAck("Stats.Overview", utcOffsetMinutes)) as AdminOverview;
        failed.value = overview.value === undefined;
    } catch {
        failed.value = true;
    } finally {
        loading.value = false;
    }
}

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    if (hours === 0) return `${minutes} min`;
    if (hours >= 10 || minutes === 0) return `${hours} h`;
    return `${hours} h ${minutes} min`;
}

function playTimeTitle(index: number): string {
    const day = overview.value?.dailyActivity[index];
    if (day === undefined) return "";
    return `${formatDuration(day.playTime)} in game\n${day.sessions} sessions`;
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
            <div v-if="!overview.telemetry.enabled" class="notice">
                Stats collection is disabled in the server config. The activity below only includes what was collected
                while it was enabled.
            </div>

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
                    <span class="stat-label">Time in game</span>
                    <strong>{{ formatDuration(overview.activity.playTime) }}</strong>
                    <small>
                        Last 30 days; {{ overview.activity.sessions }} sessions,
                        {{ formatDuration(overview.activity.averageSession) }} on average
                    </small>
                </article>
            </div>

            <div class="overview-panels">
                <div class="charts">
                    <article class="panel">
                        <div class="panel-heading">
                            <div>
                                <h2>Time in game</h2>
                                <p>
                                    Last 14 days; a session ends after 30 minutes without user input, hover a day for
                                    details
                                </p>
                            </div>
                        </div>

                        <div v-if="maxPlayTime === 0" class="empty-activity">No sessions in this period.</div>
                        <BarChart
                            v-else
                            :labels="dayLabels"
                            :series="[{ label: 'Time in game', color: colors.playTime, values: daily('playTime') }]"
                            :format-value="formatDuration"
                            duration
                            :day-title="playTimeTitle"
                        />
                    </article>

                    <article class="panel">
                        <div class="panel-heading">
                            <div>
                                <h2>Players and campaigns</h2>
                                <p>Last 14 days; unique players that connected and campaigns that were played</p>
                            </div>
                            <div class="legend">
                                <span><i :style="{ backgroundColor: colors.players }"></i>Players</span>
                                <span><i :style="{ backgroundColor: colors.campaigns }"></i>Campaigns</span>
                            </div>
                        </div>

                        <div v-if="maxUsage === 0" class="empty-activity">No sessions in this period.</div>
                        <BarChart
                            v-else
                            :labels="dayLabels"
                            :series="[
                                { label: 'Players', color: colors.players, values: daily('connectedPlayers') },
                                { label: 'Campaigns', color: colors.campaigns, values: daily('activeCampaigns') },
                            ]"
                        />
                    </article>

                    <article class="panel">
                        <div class="panel-heading">
                            <div>
                                <h2>Growth</h2>
                                <p>Last 14 days</p>
                            </div>
                            <div class="legend">
                                <span><i :style="{ backgroundColor: colors.newUsers }"></i>New users</span>
                                <span><i :style="{ backgroundColor: colors.newCampaigns }"></i>New campaigns</span>
                            </div>
                        </div>

                        <div v-if="maxGrowth === 0" class="empty-activity">
                            No new users or campaigns in this period.
                        </div>
                        <BarChart
                            v-else
                            :labels="dayLabels"
                            :series="[
                                { label: 'New users', color: colors.newUsers, values: daily('newUsers') },
                                { label: 'New campaigns', color: colors.newCampaigns, values: daily('newCampaigns') },
                            ]"
                        />
                    </article>
                </div>

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
                            <dt>Exported up to</dt>
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

.notice {
    margin-bottom: 1rem;
    padding: 0.8rem 1rem;
    border: 1px solid rgba(255, 207, 112, 0.5);
    border-radius: 12px;
    background: rgba(255, 207, 112, 0.1);
    color: #ffcf70;
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
    align-items: start;
    gap: 1rem;
}

.charts {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 0;
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

    i {
        display: inline-block;
        width: 0.65rem;
        height: 0.65rem;
        border-radius: 2px;
        margin-right: 0.3rem;
    }
}

.empty-activity {
    color: #bbb;
    min-height: 9rem;
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
    .panel-heading {
        flex-direction: column;
    }
}
</style>
