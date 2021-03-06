import { InitiativeData } from "../../models/general";
import { initiativeStore } from "../../ui/initiative/store";
import { socket } from "../socket";

socket.on("Initiative.Set", (data: InitiativeData[]) => initiativeStore.setData(data));
