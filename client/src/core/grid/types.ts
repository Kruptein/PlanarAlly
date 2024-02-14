/**
 * Axial Coords are a representation of hex grids,
 * these are sometimes also used for square grids to provide uniform APIs
 * in which case q maps to x and r to y directions.
 */
export type AxialCoords = { q: number; r: number };

/**
 * Cube Coords are similar to axial coords, in that s = -q - r.
 * Some algorithms work smoother with cube coords, so it's useful to have both.
 */
export type CubeCoord = { q: number; r: number; s: number };
