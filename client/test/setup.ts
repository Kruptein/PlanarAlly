import { vi } from "vitest";

(HTMLCanvasElement.prototype as any).getContext = () => {};

vi.mock("path-data-polyfill", vi.fn());

vi.mock("../src/core/socket", () => {
    return {
        socketManager: {
            socket: () => ({
                on: vi.fn(),
                emit: vi.fn(),
            }),
        },
    };
});
