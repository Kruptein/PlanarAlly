export enum AdminSection {
    Overview,
    Notifications,
    Users,
    Campaigns,
}

export interface DailyActivity {
    date: string;
    newUsers: number;
    newCampaigns: number;
    activeCampaigns: number;
    connectedPlayers: number;
    sessions: number;
}

export interface AdminOverview {
    totals: {
        users: number;
        campaigns: number;
        memberships: number;
        activeUsers: number;
    };
    activity: {
        newUsers: number;
        newCampaigns: number;
        sessions: number;
    };
    telemetry: {
        enabled: boolean;
        exportEnabled: boolean;
        pendingEvents: number;
        lastExport: string | null;
        serverStarted: string | null;
    };
    dailyActivity: DailyActivity[];
}
