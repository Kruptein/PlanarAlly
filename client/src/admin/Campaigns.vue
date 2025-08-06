<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { socket } from "./socket";

interface Campaign {
    name: string;
    creator: string;
}

const campaigns = ref<Campaign[]>([]);
const filter = ref("");

onMounted(async () => {
    const data = (await socket.emitWithAck("Campaigns.List")) as Campaign[];
    campaigns.value = data.sort((a, b) => a.name.localeCompare(b.name));
});

const filteredCampaigns = computed(() => {
    const filterV = filter.value.toLowerCase();
    return campaigns.value.filter(
        (c) => c.name.toLowerCase().includes(filterV) || c.creator.toLowerCase().includes(filterV),
    );
});
</script>

<template>
    <section class="content-section">
        <div id="campaigns">
            <div id="campaigns-header">
                <div class="header username">Name</div>
                <div class="header username">Creator</div>

                <input v-model="filter" class="filter fullWidth" type="text" placeholder="filter name" />
            </div>

            <div id="campaigns-list">
                <template v-for="campaign in filteredCampaigns" :key="`${campaign.name}-${campaign.creator}`">
                    <div class="username">{{ campaign.name }}</div>
                    <div class="username">{{ campaign.creator }}</div>
                </template>
                <template v-if="filteredCampaigns.length === 0">
                    <div class="fullWidth">No campaigns match the current filter.</div>
                </template>
            </div>
        </div>
    </section>
</template>

<style scoped lang="scss">
.pointer:hover {
    cursor: pointer;
}

#campaigns-header,
#campaigns-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    flex-direction: column;

    > div {
        padding-top: 10px;
        padding-bottom: 10px;
        border-bottom: dashed 1px;
    }

    .filter {
        padding: 10px;
        margin-top: 10px;
        margin-bottom: 10px;
    }

    .username {
        padding-left: 50px;
        text-align: left;
    }

    .fullWidth {
        grid-column: 1 / 3;
    }
}

#campaigns-header {
    font-weight: bold;
    border-bottom: solid 2px;
}

#campaigns-list {
    max-height: calc(100vh - 18rem);
    overflow-y: auto;
}
</style>
