import type { CharacterCreate } from "../../../apiTypes";
import { wrapSocket } from "../../api/socket";

import type { CharacterId } from "./models";

export const sendCreateCharacter = wrapSocket<CharacterCreate>("Character.Create");
export const sendRemoveCharacter = wrapSocket<CharacterId>("Character.Remove");
