<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { auth_fetch } from "../utils";

const loading = ref(true);
const campaigns = ref<{ name: string; creator: string }[]>([]);
const filter = ref("");

const filteredCampaigns = computed(() => {
    const filterV = filter.value.toLowerCase();
    return campaigns.value.filter(
        (u) =>
            u.name.toLowerCase().includes(filterV) ||
            u.creator.toLowerCase().includes(filterV)
    );
});

onMounted(async () => {
    const data = await auth_fetch("campaigns");
    loading.value = false;
    campaigns.value = await data.json();
});
</script>

<template>
    <div v-if="loading">Loading Campaigns</div>
    <div id="campaigns" v-else>
        <div class="header name">Name {{ filter }}</div>
        <div class="header">Creator</div>

        <input
            class="filter fullWidth"
            v-model="filter"
            type="text"
            placeholder="filter name or creator"
        />

        <template v-for="campaign in filteredCampaigns">
            <div class="name">{{ campaign.name }}</div>
            <div>{{ campaign.creator }}</div>
        </template>
        <template v-if="filteredCampaigns.length === 0">
            <div class="fullWidth">No campaigns match the current filter.</div>
        </template>
    </div>
</template>

<style lang="scss">
.pointer {
    cursor: pointer;

    &:hover {
        font-weight: bold;
    }
}

#campaigns {
    margin: 50px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    flex-direction: column;

    > div {
        padding-top: 10px;
        padding-bottom: 10px;
        border-bottom: dashed 1px;
    }

    .header {
        font-weight: bold;
        border-bottom: solid 2px;
    }

    .filter {
        padding-top: 10px;
        padding-bottom: 10px;
        margin-top: 10px;
        margin-bottom: 10px;
    }

    .name {
        padding-left: 50px;
        text-align: left;
    }

    .fullWidth {
        grid-column: 1 / 3;
    }
}
</style>
