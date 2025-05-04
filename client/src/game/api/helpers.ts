import { socket } from "./socket";

export function wrapSocket<T>(event: string): (data: T) => void {
    return (data: T): void => {
        socket.emit(event, data);
    };
}

export function wrapSocketWithAck<Y>(event: string): () => Promise<Y>;
export function wrapSocketWithAck<T, Y>(event: string): (data: T) => Promise<Y>;
export function wrapSocketWithAck<T, Y>(event: string): (data?: T) => Promise<Y> {
    return async (data?: T): Promise<Y> => {
        if (data !== undefined) return (await socket.emitWithAck(event, data)) as Y;
        return (await socket.emitWithAck(event)) as Y;
    };
}
