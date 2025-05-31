import type { Socket } from "socket.io-client";
import { Manager } from "socket.io-client";

export function createNewManager(): Manager {
    return new Manager(location.protocol + "//" + location.host, {
        autoConnect: false,
        path: import.meta.env.BASE_URL + "socket.io",
        transports: ["websocket", "polling"],
    });
}

export const socketManager = createNewManager();

function wrapSocket<T>(socket: Socket, event: string): (data: T) => void {
    return (data: T): void => {
        socket.emit(event, data);
    };
}

function wrapSocketWithAck<Y>(socket: Socket, event: string): () => Promise<Y> {
    return async (): Promise<Y> => {
        return (await socket.emitWithAck(event)) as Y;
    };
}

function wrapSocketWithDataAck<T, Y>(socket: Socket, event: string): (data: T) => Promise<Y> {
    return async (data: T): Promise<Y> => {
        return (await socket.emitWithAck(event, data)) as Y;
    };
}

export function generateSocketHelpers(socket: Socket): {
    wrapSocket: <T>(event: string) => (data: T) => void;
    wrapSocketWithAck: <Y>(event: string) => () => Promise<Y>;
    wrapSocketWithDataAck: <T, Y>(event: string) => (data: T) => Promise<Y>;
} {
    return {
        wrapSocket: (event: string) => wrapSocket(socket, event),
        wrapSocketWithAck: (event: string) => wrapSocketWithAck(socket, event),
        wrapSocketWithDataAck: (event: string) => wrapSocketWithDataAck(socket, event),
    };
}
