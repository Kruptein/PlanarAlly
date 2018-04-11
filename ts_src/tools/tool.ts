export abstract class Tool {
    detailDiv?: JQuery<HTMLElement>;
    abstract onMouseDown(e: MouseEvent): void;
    abstract onMouseMove(e: MouseEvent): void;
    abstract onMouseUp(e: MouseEvent): void;
    onContextMenu(e: MouseEvent) { };
}