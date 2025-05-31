import type { Manager } from "socket.io-client";
import { vi } from "vitest";

(HTMLCanvasElement.prototype as any).getContext = () => {};

vi.mock("path-data-polyfill", () => {
    return { default: vi.fn() };
});

function createMockManager(): { socket: () => { connect: () => void; on: () => void; emit: () => void } } {
    return {
        socket: () => ({
            connect: vi.fn(),
            on: vi.fn(),
            emit: vi.fn(),
        }),
    };
}

vi.mock(import("../src/core/socket"), async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        createNewManager: createMockManager as unknown as () => Manager,
        socketManager: createMockManager() as unknown as Manager,
    };
});
