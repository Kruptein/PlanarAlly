<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { assetState } from "../state";

const { t } = useI18n();
</script>

<template>
    <div
        v-show="
            assetState.reactive.expectedUploads > 0 &&
            assetState.reactive.expectedUploads !== assetState.reactive.resolvedUploads
        "
        id="progressbar"
    >
        <div id="progressbar-label">
            {{ t("assetManager.AssetManager.uploading") }} {{ assetState.reactive.resolvedUploads }} /
            {{ assetState.reactive.expectedUploads }}
        </div>
        <div id="progressbar-meter">
            <span
                :style="{
                    width: (assetState.reactive.resolvedUploads / assetState.reactive.expectedUploads) * 100 + '%',
                }"
            ></span>
        </div>
    </div>
</template>

<style scoped lang="scss">
#progressbar {
    position: sticky;
    bottom: 2rem;

    margin-top: 2rem;

    display: flex;
    flex-direction: row;

    border: solid 2px white;
    border-radius: 15px;
    overflow: hidden;

    #progressbar-label {
        padding: 10px 15px;
        background-color: rgba(137, 0, 37, 1);
        font-weight: bold;
    }

    #progressbar-meter {
        background-color: white;
        padding: 1px;
        flex-grow: 2;

        > span {
            display: block;
            height: 100%;
            position: relative;
            overflow: hidden;
            background-color: rgba(137, 0, 37, 1);
            background-image: linear-gradient(to bottom, rgba(137, 0, 37, 1) 37%, rgba(137, 0, 37, 1) 69%);
            box-shadow:
                inset 0 2px 9px rgba(255, 255, 255, 0.3),
                inset 0 -2px 6px rgba(0, 0, 0, 0.4);

            &:after {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                bottom: 0;
                right: 0;
                background-image: linear-gradient(
                    -45deg,
                    rgba(255, 255, 255, 0.2) 25%,
                    transparent 25%,
                    transparent 50%,
                    rgba(255, 255, 255, 0.2) 50%,
                    rgba(255, 255, 255, 0.2) 75%,
                    transparent 75%,
                    transparent
                );
                z-index: 1;
                background-size: 50px 50px;
                overflow: hidden;
                animation: move 2s linear infinite;
            }
        }
    }

    @keyframes move {
        0% {
            background-position: 0 0;
        }
        100% {
            background-position: 50px 50px;
        }
    }
}
</style>
