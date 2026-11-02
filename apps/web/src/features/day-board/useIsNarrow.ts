import { useEffect, useState } from "react";

const QUERY = "(max-width: 720px)";

export function useIsNarrow() {
  const [isNarrow, setIsNarrow] = useState(() => window.matchMedia(QUERY).matches);

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const update = () => setIsNarrow(media.matches);

    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  return isNarrow;
}
