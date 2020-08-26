import { socket } from "./socket";

export function wrapSocket<T>(event: string): (data: T) => void {
    return (data: T): void => {
        socket.emit(event, data);
    };
}
