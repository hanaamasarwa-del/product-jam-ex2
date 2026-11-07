import type { ApodPicture, Explanation } from "@shared/schemas/nasa";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { isExplanationBusy } from "./labels";
import { retryWhileBusy } from "./retry";

/*
 * Talking to /api/nasa/* from the browser. Same pattern as the events hooks.
 *
 * The browser never calls NASA or Gemini, and never sends their text: it asks
 * OUR server for pictures, and asks it to explain one by sending only its date.
 */

export const nasaKeys = {
  /** Every list of pictures. */
  pictures: ["nasa", "pictures"] as const,
  /** One particular random selection. */
  selection: (number: number) => ["nasa", "pictures", number] as const,
};

/**
 * A random selection of up to 20 pictures. Each `selection` number is its own
 * selection: ask for a new number to get new pictures. A selection is kept as
 * it is (never refetched on its own), or the pictures would change under the
 * reader's eyes.
 */
export function usePictures(selection: number) {
  return useQuery({
    queryKey: nasaKeys.selection(selection),
    queryFn: () => api<ApodPicture[]>("/api/nasa/pictures"),
    staleTime: Infinity,
    // Show a failure straight away, with a Try again button, instead of making
    // someone wait through a second slow attempt.
    retry: false,
  });
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Asks for the Hebrew explanation of one picture.
 *
 *     const explain = useExplain(picture.date);
 *     explain.mutate();
 *
 * Gemini can take a while, so `isPending` stays true until it is done. If
 * someone else is already explaining the same picture, the server says so
 * (409) and we quietly ask again until their answer is saved.
 */
export function useExplain(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      retryWhileBusy(
        () =>
          api<Explanation>("/api/nasa/explanations", {
            method: "POST",
            body: { date },
          }),
        { isBusy: isExplanationBusy, wait: sleep },
      ),
    onSuccess: (explanation) => {
      // Put the Hebrew straight onto the card, in every selection that has it.
      queryClient.setQueriesData<ApodPicture[]>(
        { queryKey: nasaKeys.pictures },
        (pictures) =>
          pictures?.map((picture) =>
            picture.date === explanation.date
              ? {
                  ...picture,
                  hebrew: {
                    title_he: explanation.title_he,
                    summary_he: explanation.summary_he,
                    tags: explanation.tags,
                  },
                }
              : picture,
          ),
      );
    },
  });
}
