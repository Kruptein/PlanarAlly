import { socket } from "../socket";
import { initiativeStore } from "../../ui/initiative/store";
import { InitiativeData } from "../../comm/types/general";

socket.on("Initiative.Set", (data: InitiativeData[]) => initiativeStore.setData(data));
