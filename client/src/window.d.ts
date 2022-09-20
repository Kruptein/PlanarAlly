declare global {
    interface Window {
        Gameboard?: {
            getBoardId(): string;
            getBoardServiceWebSocketUrl(): string;
            getIpAddress(): string;
            hasLowMemory(): boolean;
            returnToServerSelect(): void;
            setDrawerVisibility(visible: boolean): void;
        };
        GameboardAnalytics?: {
            sendEvent(eventType: string, extras: string);
            sendPlayEvent(extras: any): void;
        };
    }
}

export {};
