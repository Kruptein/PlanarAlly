/***
 * BiArrMap is a bidirectional map used to store many-to-many data.
 *
 * Data insertion is only possible through the `add` method.
 * This allows you to add a pair K1, K2, which will be used as the keys for the two internal maps.
 * The other value will be stored in an array for the key. (i.e.  K1: [K2], K2: [K1])
 *
 * Changes to 1 map will be reflected in the other map.
 * A key that has no values left, will be removed in order to keep `.has` behaviour consistent.
 */

export class BiArrMap<K1, K2> {
    private map1 = new Map<K1, K2[]>();
    private map2 = new Map<K2, K1[]>();

    constructor(entries?: Iterable<[K1, K2]>) {
        for (const [k1, k2] of entries ?? []) {
            this.add(k1, k2);
        }
    }

    clear(): void {
        this.map1.clear();
        this.map2.clear();
    }

    add(k1: K1, k2: K2): void {
        if (!this.map1.has(k1)) this.map1.set(k1, []);
        this.map1.get(k1)!.push(k2);
        if (!this.map2.has(k2)) this.map2.set(k2, []);
        this.map2.get(k2)!.push(k1);
    }

    get1(k1: K1): K2[] | undefined {
        return this.map1.get(k1);
    }

    get2(k2: K2): K1[] | undefined {
        return this.map2.get(k2);
    }

    deletePair(k1: K1, k2: K2): void {
        const k1s = this.map1.get(k1);
        if (k1s !== undefined) this._deleteSingle(this.map1, k1, k2);
        const k2s = this.map2.get(k2);
        if (k2s !== undefined) this._deleteSingle(this.map2, k2, k1);
    }

    delete1(k1: K1): void {
        this._deleteAll(k1, this.map1, this.map2);
    }

    delete2(k2: K2): void {
        this._deleteAll(k2, this.map2, this.map1);
    }

    has1(k1: K1): boolean {
        return this.map1.has(k1);
    }

    entries1(): MapIterator<[K1, K2[]]> {
        return this.map1.entries();
    }

    keys2(): MapIterator<K2> {
        return this.map2.keys();
    }

    // Delete from map all data associated with key `k`
    // and from other_map the key `k` if present
    private _deleteAll<K extends K1 | K2, OK = K extends K1 ? K2 : K1>(
        k: K,
        map: Map<K, OK[]>,
        otherMap: Map<OK, K[]>,
    ): void {
        for (const otherK of map.get(k) ?? []) {
            const newOther = otherMap.get(otherK)?.filter((_k) => _k !== k) ?? [];
            if (newOther.length > 0) otherMap.set(otherK, newOther);
            else otherMap.delete(otherK);
        }
        map.delete(k);
    }

    // Delete from the given map for key `k` the value `ok`
    private _deleteSingle<K extends K1 | K2, OK = K extends K1 ? K2 : K1>(map: Map<K, OK[]>, k: K, ok: OK): void {
        const remaining = (map.get(k) ?? []).filter((_k) => _k !== ok);
        if (remaining.length > 0) map.set(k, remaining);
        else map.delete(k);
    }
}
