import type { ApodPicture } from "@shared/schemas/nasa";
import { useExplain } from "./hooks";
import { errorText } from "./labels";
import { PictureCardView } from "./PictureCardView";

/**
 * A picture card that can ask the server for its Hebrew explanation. Each card
 * has its own request, so one card thinking does not hold up the others.
 */
export function PictureCard({ picture }: { picture: ApodPicture }) {
  const explain = useExplain(picture.date);

  return (
    <PictureCardView
      picture={picture}
      status={
        explain.isPending ? "pending" : explain.isError ? "error" : "idle"
      }
      errorMessage={explain.isError ? errorText(explain.error) : undefined}
      onExplain={() => explain.mutate()}
    />
  );
}
