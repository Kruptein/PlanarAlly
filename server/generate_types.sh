#!/usr/bin/env bash

PYTHONPATH=`pwd` pydantic2ts --module src.api.models --json2ts-cmd ../client/node_modules/.bin/json2ts --output ../client/src/apiTypes.ts
sed -i 's/"GlobalId"/GlobalId/g' ../client/src/apiTypes.ts
sed -i 's/"TrackerId"/TrackerId/g' ../client/src/apiTypes.ts
sed -i 's/"AuraId"/AuraId/g' ../client/src/apiTypes.ts
sed -i 's/"ClientId"/ClientId/g' ../client/src/apiTypes.ts
sed -i 's/"PlayerId"/PlayerId/g' ../client/src/apiTypes.ts
sed -i 's/"CharacterId"/CharacterId/g' ../client/src/apiTypes.ts
sed -i 's/"LayerName"/LayerName/g' ../client/src/apiTypes.ts
sed -i 's/"AssetId"/AssetId/g' ../client/src/apiTypes.ts
sed -i 's/"Role"/Role/g' ../client/src/apiTypes.ts
sed -i 's/"VisionBlock"/VisionBlock/g' ../client/src/apiTypes.ts
sed -i 's/"GridModeLabelFormat"/GridModeLabelFormat/g' ../client/src/apiTypes.ts
sed -i '1s/^/'\
'import type { AssetId } from ".\/assets\/models";\n'\
'import type { GlobalId } from ".\/core\/id";\n'\
'import type { LayerName } from ".\/game\/models\/floor";\n'\
'import type { Role } from ".\/game\/models\/role";\n'\
'import type { AuraId } from ".\/game\/systems\/auras\/models";\n'\
'import type { CharacterId } from ".\/game\/systems\/characters\/models";\n'\
'import type { ClientId } from ".\/game\/systems\/client\/models";\n'\
'import type { PlayerId } from ".\/game\/systems\/players\/models";\n'\
'import type { VisionBlock } from ".\/game\/systems\/properties\/types";\n'\
'import type { GridModeLabelFormat } from ".\/game\/systems\/settings\/players\/models";\n'\
'import type { TrackerId } from ".\/game\/systems\/trackers\/models";\n'\
'\n'\
'export type ApiShape = ApiAssetRectShape | ApiRectShape | ApiCircleShape | ApiCircularTokenShape | ApiPolygonShape | ApiTextShape | ApiLineShape | ApiToggleCompositeShape\n'\
'export type ApiDataBlock = ApiRoomDataBlock | ApiShapeDataBlock | ApiUserDataBlock\n'\
'\n/' ../client/src/apiTypes.ts
