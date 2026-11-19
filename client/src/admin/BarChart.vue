<script setup lang="ts">
import { computed } from "vue";

export interface BarSeries {
    label: string;
    color: string;
    values: number[];
}

const props = defineProps<{
    labels: string[];
    series: BarSeries[];
    formatValue?: (value: number) => string;
    // Values are durations in seconds, so the axis uses steps like 15 min or 2 h instead of plain numbers
    duration?: boolean;
    // Replaces the per bar tooltips with one tooltip for the whole day
    dayTitle?: (index: number) => string;
}>();

const TICKS = 4;
const MINUTE_STEPS = [5, 10, 15, 30, 60];

// Rounds up to 1, 2 or 5 times a power of 10
function niceStep(rough: number): number {
    const magnitude = 10 ** Math.floor(Math.log10(rough));
    const normalized = rough / magnitude;
    return (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;
}

function getStep(max: number): number {
    const rough = max / TICKS;
    if (!props.duration) return Math.max(1, niceStep(rough));
    const minutes = MINUTE_STEPS.find((step) => step * 60 >= rough);
    if (minutes !== undefined) return minutes * 60;
    return niceStep(rough / 3600) * 3600;
}

const axis = computed(() => {
    const max = Math.max(0, ...props.series.flatMap((s) => s.values));
    const step = getStep(Math.max(max, 1));
    const axisMax = Math.max(step, Math.ceil(max / step) * step);
    const ticks = Array.from({ length: Math.round(axisMax / step) + 1 }, (_, i) => i * step);
    return { max: axisMax, ticks };
});

function format(value: number): string {
    return props.formatValue?.(value) ?? value.toString();
}

function toPercentage(value: number): string {
    return `${(value / axis.value.max) * 100}%`;
}
</script>

<template>
    <div class="chart" :style="{ '--days': labels.length }">
        <div class="y-axis">
            <span v-for="tick in axis.ticks" :key="tick">{{ tick === 0 ? "0" : format(tick) }}</span>
        </div>
        <div class="days">
            <div class="grid">
                <div
                    v-for="tick in axis.ticks.slice(1)"
                    :key="tick"
                    class="gridline"
                    :style="{ bottom: toPercentage(tick) }"
                ></div>
            </div>
            <div v-for="(label, index) in labels" :key="label" class="day">
                <div class="plot" :title="dayTitle?.(index)">
                    <div
                        v-for="s in series"
                        :key="s.label"
                        class="bar"
                        :class="{ wide: series.length === 1, empty: s.values[index] === 0 }"
                        :style="{ height: toPercentage(s.values[index] ?? 0), backgroundColor: s.color }"
                        :title="dayTitle ? undefined : `${s.label}: ${format(s.values[index] ?? 0)}`"
                    ></div>
                </div>
                <span>{{ label }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.chart {
    --plot-height: 9rem;

    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
}

// The labels are spread evenly over the plot height, extended by half a line on both ends
// so that the middle of each label lines up with its gridline
.y-axis {
    display: flex;
    flex-direction: column-reverse;
    justify-content: space-between;
    height: calc(var(--plot-height) + 1em);
    margin-top: -0.5em;
    font-size: 0.65rem;
    line-height: 1em;
    color: #bbb;
    text-align: right;
    white-space: nowrap;
}

.days {
    position: relative;
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: repeat(var(--days), minmax(1.5rem, 1fr));
    gap: 0.35rem;
}

.grid {
    position: absolute;
    inset: 0 0 auto;
    height: var(--plot-height);
    pointer-events: none;
}

.gridline {
    position: absolute;
    left: 0;
    right: 0;
    border-top: 1px dashed rgba(255, 255, 255, 0.12);
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

.plot {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 2px;
    height: var(--plot-height);
    border-bottom: 1px solid rgba(255, 255, 255, 0.25);
}

.bar {
    width: 35%;
    min-height: 2px;
    border-radius: 3px 3px 0 0;
    transition: height 0.2s ease;

    &.wide {
        width: 70%;
    }

    &.empty {
        min-height: 0;
    }
}

@media (max-width: 768px) {
    .chart {
        overflow-x: auto;
    }

    .days {
        grid-template-columns: repeat(var(--days), minmax(2rem, 1fr));
    }
}
</style>
