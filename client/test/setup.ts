import { vi } from "vitest";

(HTMLCanvasElement.prototype as any).getContext = () => {};

vi.mock("path-data-polyfill", vi.fn());

function createMockManager(): { socket: () => { connect: () => void; on: () => void; emit: () => void } } {
    return {
        socket: () => ({
            connect: vi.fn(),
            on: vi.fn(),
            emit: vi.fn(),
        }),
    };
}

vi.mock("../src/core/socket", () => {
    return {
        createNewManager: createMockManager,
        socketManager: createMockManager(),
    };
});
