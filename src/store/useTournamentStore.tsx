import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { nanoid } from "nanoid/non-secure";

// Types
export type Division = { id: string; name: string };
export type Player = { id: string; name: string; divisionId: string };
export type MatchResult = { winnerId: string; gammon: boolean };
export type Match = {
  id: string;
  divisionId: string;
  playerAId: string;
  playerBId: string;
  result?: MatchResult;
};

export type StandingsRow = {
  player: Player;
  wins: number;
  losses: number;
  gammonWins: number;
};

export type PlayoffMatch = {
  id: string;
  roundIndex: number; // 0 = quarter, ...
  aId?: string;
  bId?: string;
  winnerId?: string;
};

export type Playoffs = {
  size: 4 | 8 | 16;
  rounds: PlayoffMatch[][]; // rounds[0] is first round
  seeded: boolean;
};

export type TournamentState = {
  divisions: Division[];
  players: Player[];
  matches: Match[];
  playoffs?: Playoffs;
};

const initialState: TournamentState = {
  divisions: [],
  players: [],
  matches: [],
};

// Actions
type Action =
  | { type: "ADD_DIVISION"; name: string; id?: string }
  | { type: "REMOVE_DIVISION"; id: string }
  | { type: "ADD_PLAYER"; divisionId: string; name: string }
  | { type: "REMOVE_PLAYER"; id: string }
  | { type: "GENERATE_MATCHES" }
  | { type: "RECORD_RESULT"; matchId: string; winnerId: string; gammon: boolean }
  | { type: "RESET_TOURNAMENT" }
  | { type: "SEED_PLAYOFFS"; size: 4 | 8 | 16 }
  | { type: "RECORD_PLAYOFF_RESULT"; matchId: string; winnerId: string };

// Helpers
const localKey = "bgm_tournament_v1";

function loadState(): TournamentState | null {
  try {
    const raw = localStorage.getItem(localKey);
    if (!raw) return null;
    return JSON.parse(raw) as TournamentState;
  } catch {
    return null;
  }
}

function saveState(state: TournamentState) {
  try {
    localStorage.setItem(localKey, JSON.stringify(state));
  } catch {}
}

function combinations<T>(arr: T[]): [T, T][] {
  const result: [T, T][] = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      result.push([arr[i], arr[j]]);
    }
  }
  return result;
}

function computeStandingsMap(state: TournamentState): Record<string, StandingsRow[]> {
  const byDivision: Record<string, StandingsRow[]> = {};
  state.divisions.forEach((d) => {
    const rows: Record<string, StandingsRow> = {};
    state.players
      .filter((p) => p.divisionId === d.id)
      .forEach((p) => {
        rows[p.id] = { player: p, wins: 0, losses: 0, gammonWins: 0 };
      });
    state.matches
      .filter((m) => m.divisionId === d.id && m.result)
      .forEach((m) => {
        const res = m.result!;
        const loserId = res.winnerId === m.playerAId ? m.playerBId : m.playerAId;
        rows[res.winnerId].wins += 1;
        rows[loserId].losses += 1;
        if (res.gammon) rows[res.winnerId].gammonWins += 1;
      });
    const list = Object.values(rows).sort((a, b) =>
      b.wins - a.wins || b.gammonWins - a.gammonWins || a.player.name.localeCompare(b.player.name)
    );
    byDivision[d.id] = list;
  });
  return byDivision;
}

function seedPlayoffRounds(topPlayers: Player[], size: 4 | 8 | 16): PlayoffMatch[][] {
  const rounds: PlayoffMatch[][] = [];
  // First round seeding: 1 vs size, 2 vs size-1, etc.
  const first: PlayoffMatch[] = [];
  for (let i = 0; i < size / 2; i++) {
    const a = topPlayers[i]?.id;
    const b = topPlayers[size - 1 - i]?.id;
    first.push({ id: nanoid(), roundIndex: 0, aId: a, bId: b });
  }
  rounds.push(first);
  // Create empty subsequent rounds
  let remaining = size / 2;
  let roundIdx = 1;
  while (remaining >= 1) {
    const round: PlayoffMatch[] = [];
    for (let i = 0; i < Math.floor(remaining / 2); i++) {
      round.push({ id: nanoid(), roundIndex: roundIdx });
    }
    if (round.length > 0) rounds.push(round);
    remaining = Math.floor(remaining / 2);
    roundIdx++;
  }
  return rounds;
}

function propagateWinners(playoffs: Playoffs): Playoffs {
  const rounds = playoffs.rounds.map((r) => r.map((m) => ({ ...m })));
  for (let r = 0; r < rounds.length - 1; r++) {
    const current = rounds[r];
    const next = rounds[r + 1];
    current.forEach((m, idx) => {
      if (!m.winnerId) return;
      const nextMatchIndex = Math.floor(idx / 2);
      const isA = idx % 2 === 0;
      const target = next[nextMatchIndex];
      if (target) {
        if (isA) target.aId = m.winnerId;
        else target.bId = m.winnerId;
      }
    });
  }
  return { ...playoffs, rounds };
}

function reducer(state: TournamentState, action: Action): TournamentState {
  switch (action.type) {
    case "ADD_DIVISION": {
      const division: Division = { id: action.id ?? nanoid(), name: action.name.trim() };
      if (!division.name) return state;
      return { ...state, divisions: [...state.divisions, division] };
    }
    case "REMOVE_DIVISION": {
      const divisions = state.divisions.filter((d) => d.id !== action.id);
      const players = state.players.filter((p) => p.divisionId !== action.id);
      const matches = state.matches.filter((m) => m.divisionId !== action.id);
      return { ...state, divisions, players, matches };
    }
    case "ADD_PLAYER": {
      const name = action.name.trim();
      if (!name) return state;
      const player: Player = { id: nanoid(), name, divisionId: action.divisionId };
      return { ...state, players: [...state.players, player] };
    }
    case "REMOVE_PLAYER": {
      const players = state.players.filter((p) => p.id !== action.id);
      const matches = state.matches.filter((m) => m.playerAId !== action.id && m.playerBId !== action.id);
      return { ...state, players, matches };
    }
    case "GENERATE_MATCHES": {
      // Round-robin per division (single match per pair)
      const matches: Match[] = [];
      state.divisions.forEach((d) => {
        const players = state.players.filter((p) => p.divisionId === d.id);
        combinations(players).forEach(([a, b]) => {
          matches.push({ id: nanoid(), divisionId: d.id, playerAId: a.id, playerBId: b.id });
        });
      });
      return { ...state, matches };
    }
    case "RECORD_RESULT": {
      const matches = state.matches.map((m) => (m.id === action.matchId ? { ...m, result: { winnerId: action.winnerId, gammon: action.gammon } } : m));
      return { ...state, matches };
    }
    case "SEED_PLAYOFFS": {
      // Take top 2 from each division, seed cross-division (1 vs next division's 2),
      // and assign byes to highest seeds when participants are not a power of two.
      const standingsByDiv = computeStandingsMap(state);
      const divisions = state.divisions;

      // Build lookup for quick stat comparison
      const allRows: StandingsRow[] = Object.values(standingsByDiv).flat();
      const rowByPlayer: Record<string, StandingsRow> = Object.fromEntries(
        allRows.map((r) => [r.player.id, r])
      );
      const cmp = (aId: string, bId: string) => {
        const a = rowByPlayer[aId];
        const b = rowByPlayer[bId];
        if (!a && !b) return 0;
        if (!a) return 1;
        if (!b) return -1;
        return (
          b.wins - a.wins ||
          b.gammonWins - a.gammonWins ||
          a.player.name.localeCompare(b.player.name)
        );
      };

      // Collect 1-seeds and 2-seeds per division (only divisions with at least 1/2 players)
      const divsWithRows = divisions.map((d) => ({ d, rows: standingsByDiv[d.id] || [] }));
      const oneSeedsByDiv = divsWithRows.map(({ rows }) => rows[0]?.player).filter(Boolean) as Player[];
      const twoSeedsByDiv = divsWithRows.map(({ rows }) => rows[1]?.player).filter(Boolean) as Player[];

      const totalPlayers = oneSeedsByDiv.length + twoSeedsByDiv.length;
      if (totalPlayers < 2) return state;

      // Determine bracket size (4|8|16)
      const size = (totalPlayers <= 4 ? 4 : totalPlayers <= 8 ? 8 : 16) as 4 | 8 | 16;
      const numByes = size - totalPlayers; // always even

      // Rank seeds globally: first all 1-seeds by performance, then 2-seeds
      const sortedOne = [...oneSeedsByDiv].sort((a, b) => cmp(a.id, b.id));
      const sortedTwo = [...twoSeedsByDiv].sort((a, b) => cmp(a.id, b.id));

      // Highest seeds receive byes (prefer 1-seeds first)
      const byeIds: string[] = [];
      for (const p of sortedOne) {
        if (byeIds.length >= numByes) break;
        byeIds.push(p.id);
      }
      for (const p of sortedTwo) {
        if (byeIds.length >= numByes) break;
        byeIds.push(p.id);
      }
      const byeSet = new Set(byeIds);

      // Build initial cross-division pairings using only divisions that have both seeds
      const pairDivIndices = divsWithRows
        .map((x, i) => (x.rows.length >= 2 ? i : -1))
        .filter((i) => i !== -1) as number[];

      const firstRound: PlayoffMatch[] = [];
      const leftovers: string[] = [];

      if (pairDivIndices.length > 0) {
        for (let k = 0; k < pairDivIndices.length; k++) {
          const i = pairDivIndices[k];
          const j = pairDivIndices[(k + 1) % pairDivIndices.length];
          const a = divsWithRows[i].rows[0]?.player.id;
          const b = divsWithRows[j].rows[1]?.player.id;
          if (!a || !b) continue;

          // If any side has a bye, remove this pair and collect the opponent
          if (byeSet.has(a) && byeSet.has(b)) {
            // both are byes -> each will be advanced separately
            continue;
          } else if (byeSet.has(a)) {
            leftovers.push(b);
            continue;
          } else if (byeSet.has(b)) {
            leftovers.push(a);
            continue;
          } else {
            firstRound.push({ id: nanoid(), roundIndex: 0, aId: a, bId: b });
          }
        }
      }

      // Add any divisions that only had a 1-seed (no 2-seed) into leftovers if they didn't get a bye
      for (let idx = 0; idx < divsWithRows.length; idx++) {
        const rows = divsWithRows[idx].rows;
        if (rows.length === 1) {
          const pid = rows[0].player.id;
          if (!byeSet.has(pid)) leftovers.push(pid);
        }
      }

      // Pair leftovers among themselves
      for (let i = 0; i + 1 < leftovers.length; i += 2) {
        firstRound.push({ id: nanoid(), roundIndex: 0, aId: leftovers[i], bId: leftovers[i + 1] });
      }

      // Create bye matches (auto-advance winners)
      for (const id of byeIds) {
        firstRound.push({ id: nanoid(), roundIndex: 0, aId: id, winnerId: id });
      }

      // Ensure correct number of first-round matches by padding with empty if needed
      const expectedFirstRound = size / 2;
      while (firstRound.length < expectedFirstRound) {
        firstRound.push({ id: nanoid(), roundIndex: 0 });
      }

      // Subsequent rounds
      const rounds: PlayoffMatch[][] = [];
      rounds.push(firstRound);
      let remaining = size / 2;
      let roundIdx = 1;
      while (remaining >= 1) {
        const round: PlayoffMatch[] = [];
        for (let i = 0; i < Math.floor(remaining / 2); i++) {
          round.push({ id: nanoid(), roundIndex: roundIdx });
        }
        if (round.length > 0) rounds.push(round);
        remaining = Math.floor(remaining / 2);
        roundIdx++;
      }

      const playoffs: Playoffs = { size, rounds, seeded: true };
      return { ...state, playoffs };
    }
    case "RECORD_PLAYOFF_RESULT": {
      if (!state.playoffs) return state;
      const rounds = state.playoffs.rounds.map((round) => round.map((m) => ({ ...m })));
      for (let r = 0; r < rounds.length; r++) {
        const idx = rounds[r].findIndex((m) => m.id === action.matchId);
        if (idx !== -1) {
          rounds[r][idx].winnerId = action.winnerId;
          break;
        }
      }
      const updated = propagateWinners({ ...state.playoffs, rounds });
      return { ...state, playoffs: updated };
    }
    case "RESET_TOURNAMENT": {
      return initialState;
    }
    default:
      return state;
  }
}

// Context
const TournamentContext = createContext<{
  state: TournamentState;
  dispatch: React.Dispatch<Action>;
  standingsByDivision: Record<string, StandingsRow[]>;
} | null>(null);

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, () => loadState() ?? initialState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const standingsByDivision = useMemo(() => computeStandingsMap(state), [state]);

  return (
    <TournamentContext.Provider value={{ state, dispatch, standingsByDivision }}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error("useTournament must be used within TournamentProvider");
  return ctx;
}
