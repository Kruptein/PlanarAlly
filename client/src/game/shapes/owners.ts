export interface ShapeOwner {
    shape: string;
    user: string;
    access: ShapeAccess;
}

export interface PartialShapeOwner {
    shape: string;
    user: string;
    access: Partial<ShapeAccess>;
}

export interface ShapeAccess {
    edit: boolean;
    vision: boolean;
    movement: boolean;
}
