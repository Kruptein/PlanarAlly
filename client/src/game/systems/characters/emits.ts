import type { CharacterCreate } from "../../../apiTypes";
import { wrapSocket } from "../../api/helpers";

import type { CharacterId } from "./models";

export const sendCreateCharacter = wrapSocket<CharacterCreate>("Character.Create");
export const sendRemoveCharacter = wrapSocket<CharacterId>("Character.Remove");
