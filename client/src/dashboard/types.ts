export interface RoomInfo {
    name: string;
    creator: string;
    logo?: string;
    is_locked: boolean;
}

export enum Navigation {
    Play,
    Run,
    Create,
    Import,
    Settings,
    AssetManage,
    AssetCreate,
    Logout,

    Account,
    Back,
}

type NavigationHeader = {
    text: string;
    type: "header";
};

type NavigationSeparator = {
    type: "separator";
};

type NavigationAction = {
    type: "action";
    navigation: Navigation;
    fn: (navigation: Navigation) => void;
};

export type NavigationEntry = NavigationHeader | NavigationSeparator | NavigationAction;
