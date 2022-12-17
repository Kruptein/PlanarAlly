declare global {
    interface Window {
        gbCodes?: {
            dm: string;
            gb: string;
        };
        Gameboard?: {
            getBoardId: () => string;
            getBoardServiceWebSocketUrl: () => string;
            getIpAddress: () => string;
            hasLowMemory: () => boolean;
            returnToServerSelect: () => void;
            setDrawerVisibility: (visible: boolean) => void;
        };
        GameboardAnalytics?: {
            sendEvent: (eventType: string, extras: string) => void;
            sendPlayEvent: (extras: any) => void;
        };
    }
}

export {};
