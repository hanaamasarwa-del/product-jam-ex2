import {
  newGame,
  nextPlayer,
  playMove,
  type GameState,
} from "@shared/game/rules";
import { useState } from "react";
import { Button, Card, Spinner } from "../../components";
import { Board } from "../../features/games/Board";
import { useGames, useSaveGame } from "../../features/games/hooks";
import {
  RESULT_LABELS,
  formatPlayedAt,
  statusText,
} from "../../features/games/labels";
import { LANG } from "../../lib/config";
import styles from "./TicTacToePage.module.css";

/**
 * Big-three: tic-tac-toe on a 4x4 board, where three in a row wins. Two
 * players share the screen, and X goes first.
 *
 * This page does not know the rules. It keeps the current game in state, and
 * asks `playMove` (shared/game/rules.ts) what each click does. When a game
 * ends it sends the server the list of MOVES - not the result. The server
 * plays them again with the same functions and saves what it works out.
 */
export default function TicTacToePage() {
  const [game, setGame] = useState<GameState>(newGame);
  const gamesQuery = useGames();
  const saveGame = useSaveGame();

  const gameOver = game.result !== null;

  function handleCellClick(cell: number) {
    const next = playMove(game, cell);
    // The board disables cells that cannot be played, so this is only a
    // safety net.
    if (!next.ok) return;

    setGame(next.state);
    // Save from the click, not from an effect, so each game is saved once.
    if (next.state.result !== null) {
      saveGame.mutate({ moves: [...next.state.moves] });
    }
  }

  function startNewGame() {
    setGame(newGame());
    saveGame.reset();
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Big three</h1>
        <p className={styles.rules}>
          A 4×4 board. Take turns, X first. The first to get{" "}
          <strong>three in a row</strong> wins: across, down or diagonally.
        </p>
      </header>

      <Card padding="lg" className={styles.game}>
        <p
          role="status"
          aria-live="polite"
          className={styles.status}
          data-over={gameOver || undefined}
        >
          {statusText(game.result, nextPlayer(game))}
        </p>

        <Board
          board={game.board}
          winningLine={game.winningLine}
          disabled={gameOver}
          onCellClick={handleCellClick}
        />

        <div className={styles.saveStatus} aria-live="polite">
          {gameOver && saveGame.isPending ? (
            <p className={styles.inline}>
              <Spinner size="sm" label="Saving the game" /> Saving the game…
            </p>
          ) : null}
          {gameOver && saveGame.isSuccess ? (
            <p className={styles.saved}>Game saved.</p>
          ) : null}
          {gameOver && saveGame.isError ? (
            <div role="alert" className={styles.error}>
              <p>
                This game was not saved. {saveGame.error.message} Try saving it
                again before you start a new game.
              </p>
              <Button
                variant="secondary"
                onClick={() => saveGame.mutate({ moves: [...game.moves] })}
              >
                Try saving again
              </Button>
            </div>
          ) : null}
        </div>

        <Button onClick={startNewGame}>New game</Button>
      </Card>

      <section aria-labelledby="past-games" className={styles.history}>
        <h2 id="past-games">Your games</h2>

        {gamesQuery.isPending ? (
          <div className={styles.centered}>
            <Spinner size="lg" label="Loading your games" />
          </div>
        ) : gamesQuery.isError ? (
          <Card padding="lg">
            <p role="alert">Could not load your games.</p>
            <Button
              variant="secondary"
              onClick={() => void gamesQuery.refetch()}
            >
              Try again
            </Button>
          </Card>
        ) : gamesQuery.data.length === 0 ? (
          <Card padding="lg">
            <p className={styles.empty}>
              No games yet. Finish one and it will show up here.
            </p>
          </Card>
        ) : (
          <ul className={styles.list}>
            {gamesQuery.data.map((saved) => (
              <li key={saved.id}>
                <Card className={styles.item}>
                  <strong className={styles.result}>
                    {RESULT_LABELS[saved.result]}
                  </strong>
                  <span className={styles.moves}>
                    {saved.moves.length} moves
                  </span>
                  <time dateTime={saved.created_at} className={styles.date}>
                    {formatPlayedAt(saved.created_at, LANG)}
                  </time>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
