export let renderWorker: Worker | undefined = undefined;

export function setWorker(worker: Worker): void {
    renderWorker = worker;
}
