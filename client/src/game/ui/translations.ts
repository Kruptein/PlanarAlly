import { i18n } from "../../i18n";
import { LayerName } from "../models/floor";

const t = i18n.global.t;

export const layerTranslationMapping: Record<LayerName | string, string> = {
    [LayerName.Map]: t("layer.map"),
    [LayerName.Tokens]: t("layer.tokens"),
    [LayerName.Dm]: t("layer.dm"),
    [LayerName.Lighting]: t("layer.fow"),
    // not selectable
    [LayerName.Grid]: "",
    [LayerName.Vision]: "",
};
