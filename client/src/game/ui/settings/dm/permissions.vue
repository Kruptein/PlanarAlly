<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

// import { mapState } from "vuex";

// import Game from "../../game.vue";
// import InputCopyElement from "@/core/components/inputCopy.vue";
// import Modal from "@/core/components/modals/modal.vue";

// import { socket } from "@/game/api/socket";
// import { EventBus } from "@/game/event-bus";
// import { gameStore } from "@/game/store";

@Component
export default class PermissionsDmSettings extends Vue {
    editOwnedTokens = false;
    moveOwnedTokens = false;
    resizeOwnedTokens = false;
}
</script>

<template>
    <div class="panel">
        <div class="spanrow header" v-t="'common.tokens'"></div>
        <div class="row">
            <label for="editOwnedTokens" v-t="'game.ui.settings.permissions.edit_owned_tokens'"></label>
            <div>
                <input id="editOwnedTokens" type="checkbox" v-model="editOwnedTokens" />
            </div>
            <label for="moveOwnedTokens" v-t="'game.ui.settings.permissions.move_owned_tokens'"></label>
            <div>
                <input id="moveOwnedTokens" type="checkbox" v-model="moveOwnedTokens" />
            </div>
            <label for="resizeOwnedTokens" v-t="'game.ui.settings.permissions.resize_owned_tokens'"></label>
            <div>
                <input id="resizeOwnedTokens" type="checkbox" v-model="resizeOwnedTokens" />
            </div>
        </div>
    </div>
</template>
