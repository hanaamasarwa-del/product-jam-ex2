import type { CreateGameInput, Game } from "@shared/schemas/games";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

/*
 * Talking to /api/games from the browser. Same shape as the events hooks:
 * `useQuery` to read, `useMutation` to change, and after a change we mark the
 * list as out of date so it fetches itself again.
 */

export const gameKeys = {
  all: ["games"] as const,
};

/** The logged-in user's saved games, newest first. */
export function useGames() {
  return useQuery({
    queryKey: gameKeys.all,
    queryFn: () => api<Game[]>("/api/games"),
  });
}

/**
 * Saves a finished game. Send only the moves - the server plays them again
 * and works out the result itself.
 *
 *     const saveGame = useSaveGame();
 *     saveGame.mutate({ moves: [0, 4, 1, 5, 2] });
 */
export function useSaveGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGameInput) =>
      api<Game>("/api/games", { method: "POST", body: input }),
    onSuccess: () => {
      // The list now has one more game - fetch it again.
      void queryClient.invalidateQueries({ queryKey: gameKeys.all });
    },
  });
}
