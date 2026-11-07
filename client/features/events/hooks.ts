import type {
  CreateEventInput,
  Event,
  UpdateEventInput,
} from "@shared/schemas/events";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

/*
 * Talking to /api/events from the browser.
 *
 * TanStack Query does three annoying things for you: it remembers what it
 * already fetched, it tells you whether a request is loading or failed, and
 * it refetches when the data goes stale. You never call `fetch` in a
 * component - you call one of these hooks.
 *
 * Copy this file when you add a resource of your own. Change "events" to
 * your resource name and the URLs to match your server routes.
 */

/*
 * The names under which fetched data is filed away.
 *
 *   eventKeys.all      -> ["events"]          every event query
 *   eventKeys.one(id)  -> ["events", "<id>"]  one specific event
 *
 * They matter because of `invalidateQueries` below: after a change we throw
 * away everything filed under ["events"], and anything on screen showing
 * events refetches itself. Get these wrong and the UI shows stale data.
 */
export const eventKeys = {
  all: ["events"] as const,
  one: (id: string) => ["events", id] as const,
};

/** Every event belonging to the logged-in user. */
export function useEvents() {
  return useQuery({
    queryKey: eventKeys.all,
    queryFn: () => api<Event[]>("/api/events"),
  });
}

/** One event by id. Pass `undefined` while you don't have an id yet. */
export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: eventKeys.one(id ?? ""),
    queryFn: () => api<Event>(`/api/events/${id}`),
    enabled: Boolean(id),
  });
}

/**
 *     const createEvent = useCreateEvent();
 *     await createEvent.mutateAsync({ title, starts_at });
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEventInput) =>
      api<Event>("/api/events", { method: "POST", body: input }),
    onSuccess: () => {
      // The list is now out of date - fetch it again.
      void queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

export function useUpdateEvent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateEventInput) =>
      api<Event>(`/api/events/${id}`, { method: "PATCH", body: input }),
    onSuccess: (updated) => {
      // We already have the new version, so write it straight into the cache
      // instead of making another request for it...
      queryClient.setQueryData(eventKeys.one(id), updated);
      // ...but the list's ordering may have changed, so refetch that.
      void queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

/**
 * Uploads one image. Gives back `path` to save on the event, and `url` to
 * show it with right away.
 *
 * Do not upload straight to Supabase from the browser - it has no key that
 * can write to storage, and that is deliberate.
 */
export function useUploadImage() {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api<{ path: string; url: string | null }>("/api/uploads", {
        method: "POST",
        formData,
      });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/api/events/${id}`, { method: "DELETE" }),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: eventKeys.one(id) });
      void queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}
