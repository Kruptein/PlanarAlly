#!/usr/bin/env bash

PYTHONPATH=`pwd` pydantic2ts --module src.api.models --json2ts-cmd ../client/node_modules/.bin/json2ts --output ../client/src/apiTypes.ts
sed -i 's/"GlobalId"/GlobalId/g' ../client/src/apiTypes.ts
sed -i 's/"TrackerId"/TrackerId/g' ../client/src/apiTypes.ts
sed -i 's/"AuraId"/AuraId/g' ../client/src/apiTypes.ts
sed -i '1s/^/import type { GlobalId } from ".\/game\/id";\nimport type { AuraId } from ".\/game\/systems\/auras\/models";\nimport type { TrackerId } from ".\/game\/systems\/trackers\/models";\n\n/' ../client/src/apiTypes.ts