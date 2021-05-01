export function useToolPosition(name: string): { right: string; arrow: string } {
    const rect = document.getElementById(`${name}-selector`)!.getBoundingClientRect();
    const mid = rect.left + rect.width / 2;

    const right = Math.min(window.innerWidth - 25, mid + 75);
    return {
        right: `${window.innerWidth - right}px`,
        arrow: `${right - mid - 14}px`,
    };
}
