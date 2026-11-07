import { useState } from "react";
import { usePictures } from "../../features/nasa/hooks";
import { errorText } from "../../features/nasa/labels";
import { PictureCard } from "../../features/nasa/PictureCard";
import { NasaPageView } from "./NasaPageView";

/**
 * Random NASA pictures, each with a button for a Hebrew explanation written by
 * Gemini. The browser only ever talks to our own server; the server talks to
 * NASA and Gemini and keeps the keys.
 */
export default function NasaPage() {
  // Each number is a different random selection. "Show other pictures" moves
  // to the next number, which asks the server for a fresh set.
  const [selection, setSelection] = useState(0);
  const picturesQuery = usePictures(selection);

  return (
    <NasaPageView
      status={
        picturesQuery.isPending
          ? "loading"
          : picturesQuery.isError
            ? "error"
            : "ready"
      }
      pictures={picturesQuery.data ?? []}
      errorMessage={
        picturesQuery.isError ? errorText(picturesQuery.error) : undefined
      }
      busy={picturesQuery.isFetching}
      onMore={() => setSelection((current) => current + 1)}
      onRetry={() => void picturesQuery.refetch()}
      renderPicture={(picture) => <PictureCard picture={picture} />}
    />
  );
}
