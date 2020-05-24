export interface ShapeOwner {
    shape: string;
    user: string;
    access: Partial<{ edit: boolean; vision: boolean; movement: boolean }>;
}
