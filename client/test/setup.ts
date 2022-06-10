import { vi } from "vitest";

(HTMLCanvasElement.prototype as any).getContext = () => {};

vi.mock("path-data-polyfill", vi.fn());

vi.mock("../src/core/socket", () => {
    return {
        socketManager: {
            socket: () => ({
                connect: vi.fn(),
                on: vi.fn(),
                emit: vi.fn(),
            }),
        },
    };
});
