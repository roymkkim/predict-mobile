// The Sports category rail remembers the last sport the user opened while the
// demo session is alive. A module-level value is intentional: returning to the
// route should preserve the preference, while a full app reload resets it.
let lastSelectedSport: string | null = null;

export function getLastSelectedSport(): string | null {
  return lastSelectedSport;
}

export function setLastSelectedSport(sport: string): void {
  lastSelectedSport = sport;
}