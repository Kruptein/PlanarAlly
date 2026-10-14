const registrations = new Map<string, Set<() => void>>();

export function trackRegistration(modId: string, unregister: () => void): () => void {
    let set = registrations.get(modId);
    if (!set) {
        set = new Set();
        registrations.set(modId, set);
    }
    const bucket = set;
    bucket.add(unregister);
    return () => {
        if (!bucket.delete(unregister)) return;
        unregister();
    };
}

export function clearRegistrations(modId: string): void {
    const set = registrations.get(modId);
    if (!set) return;
    registrations.delete(modId);
    for (const unregister of set) unregister();
}
