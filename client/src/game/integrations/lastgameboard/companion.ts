import type {
    Asset,
    ButtonPressed,
    CardButtonPressed,
    CardPlayed,
    DiceRolled,
    GameBoardClient,
    GameBoardListener,
    UserPresence,
} from "@lastgameboard/boardservice-client";
import { ChangeType, ClientFactory } from "@lastgameboard/boardservice-client";

import { coreStore } from "../../../store/core";
import { diceStore } from "../../dice/state";
import { diceTool } from "../../tools/variants/dice";

export class LgCompanion implements GameBoardListener {
    userPresences: Record<string, UserPresence> = {};
    boardClient!: GameBoardClient;
    startTime?: number = undefined;

    async run(): Promise<void> {
        await diceStore.loadEnv();
        const boardId = coreStore.state.boardId;
        const url = window.Gameboard?.getBoardServiceWebSocketUrl();
        if (boardId === undefined || url === undefined) {
            if (boardId !== undefined) console.error("COULD NOT CONNECT TO GB WS");
            return;
        }
        console.log(`gameBoardClient connecting boardId=${boardId} url=${url}`);

        this.boardClient = ClientFactory.createSocketGameBoardClientWithRetries(url, boardId, 2).withGameBoardListener(
            this,
        );

        try {
            await this.boardClient.connectionManager.connect();
        } catch (e) {
            console.log(JSON.stringify(e));
        }
        console.log(`gameBoardClient connected`);

        const userPresenceList = await this.boardClient.getUserPresenceList();
        console.log(`gameBoardClient with ${userPresenceList.length} people at the board.`);
        console.log(JSON.stringify(userPresenceList));
        for (const userPresence of userPresenceList) {
            this.userPresences[userPresence.userId] = userPresence;
            console.log(
                `User ${userPresence.display ?? ""}(${userPresence.userId}) is sitting at ${
                    userPresence.boardUserPosition?.x
                },${userPresence.boardUserPosition?.y}`,
            );
            this.boardClient.sendUserMessage(userPresence.userId, "companion/rollDice", {
                ownerId: userPresence.userId,
                diceSizesToRoll: [20],
                addedModifier: 0,
            });
        }
        window.GameboardAnalytics?.sendEvent(
            "GAME_SESSION_STARTED",
            JSON.stringify({ userIds: Object.keys(this.userPresences) }),
        );
        this.startTime = performance.now();
    }

    disconnect(): void {
        if (this.startTime === undefined) return;

        const playTime = performance.now() - this.startTime;
        window.GameboardAnalytics?.sendEvent(
            "GAME_SESSION_ENDED",
            JSON.stringify({
                userIds: Object.keys(this.userPresences),
                secondsElapsed: playTime / 1000,
            }),
        );
    }

    onUserPresenceChange(userPresence: UserPresence): void {
        if (userPresence.change == ChangeType.REMOVE) {
            delete this.userPresences[userPresence.userId];
        } else {
            console.log(JSON.stringify(userPresence));
            const oldPosition = this.userPresences[userPresence.userId]?.boardUserPosition;
            this.userPresences[userPresence.userId] = userPresence;
            if (JSON.stringify(userPresence?.boardUserPosition) !== JSON.stringify(oldPosition)) {
                console.log(
                    `User ${userPresence.display ?? ""}(${userPresence.userId}) is sitting at ${
                        userPresence.boardUserPosition?.x
                    },${userPresence.boardUserPosition?.y}`,
                );
            }
            if (userPresence.change !== ChangeType.CHANGE_POSITION) {
                this.boardClient.sendUserMessage(userPresence.userId, "companion/rollDice", {
                    ownerId: userPresence.userId,
                    diceSizesToRoll: [20],
                    addedModifier: 0,
                });
            }
        }
    }

    onDiceRolled(diceRolled: DiceRolled & { diceSizesRolledList?: number[] }): void {
        console.log(JSON.stringify(diceRolled));
        window.GameboardAnalytics?.sendEvent("DICE_ROLL_INITIATED", JSON.stringify(diceRolled));
        if (diceRolled.diceNotation === undefined) {
            diceRolled.diceNotation = notation(
                diceRolled.diceSizesRolledList ?? diceRolled.diceSizesRolledList ?? [],
                diceRolled.addedModifier,
            );
        }

        const userPresence = this.userPresences[diceRolled.ownerId];
        const startPosition = [userPresence.boardUserPosition.x, userPresence.boardUserPosition.y] as [number, number];
        diceTool.roll(diceRolled.diceNotation!, {
            color: userPresence.tokenColor,
            startPosition,
            throwKey: diceRolled.ownerId,
        });
    }

    onCardButtonPressed(cardButtonPressed: CardButtonPressed): void {
        throw new Error("Method not implemented.");
    }
    onButtonPressed(buttonPressed: ButtonPressed): void {
        throw new Error("Method not implemented.");
    }

    onCardPlayed(cardPlayed: CardPlayed): void {}

    onFetchAsset(assetId: string): Asset {
        // feel free to leave blank.
        console.log("onFetchAsset", assetId);
        return null as any as Asset;
    }
}

// hack until notation is properly populated
function notation(dice: number[], modifier: number | null = null): string {
    const accum: { [key in number]: number } = {};
    dice.forEach((d) => {
        accum[d] = (accum[d] || 0) + 1;
    });
    const accumArr = Object.keys(accum).map((d) => [+d, accum[+d]]);
    accumArr.sort((ent1, ent2) => ent1[0] - ent2[0]);
    let result = accumArr.map((ent) => `${ent[1]}d${ent[0]}`).join(" ");
    if (modifier !== null) result = result + " " + (modifier >= 0 ? "+" : "") + modifier;
    return result;
}
