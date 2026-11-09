/**
 * Share a page link. Uses the system share sheet when the browser offers
 * one; otherwise copies the link and confirms on the button.
 *
 * ``url`` is optional. Omit it to share the current page. A path is resolved
 * against the current origin when the button is pressed.
 */
import { Share1Icon } from "@radix-ui/react-icons";
import { Button } from "@radix-ui/themes";
import { useEffect, useRef, useState } from "react";
import type { ComponentProps } from "react";

const SHARE_LABEL = "Share";
const SHARE_COPIED_LABEL = "Link copied";
const SHARE_RESET_MS = 2000;

type ShareButtonProps = {
  title: string;
  /** Absolute URL or site path. Defaults to the current page. */
  url?: string;
  className?: string;
  size?: ComponentProps<typeof Button>["size"];
};

const resolveUrl = (url: string | undefined): string => {
  if (!url) {
    return globalThis.location.href;
  }

  return new URL(url, globalThis.location.origin).href;
};

const shareLink = async (
  title: string,
  url: string,
  onCopied: () => void,
): Promise<void> => {
  const payload = { title, url };

  if (typeof navigator.share === "function") {
    try {
      await navigator.share(payload);
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
    }
  }

  try {
    await navigator.clipboard.writeText(url);
  } catch {
    return;
  }

  onCopied();
};

export const ShareButton = ({
  title,
  url,
  className,
  size = "2",
}: ShareButtonProps) => {
  const [label, setLabel] = useState(SHARE_LABEL);
  const resetTimer = useRef<ReturnType<typeof globalThis.setTimeout> | null>(
    null,
  );

  useEffect(
    () => () => {
      if (resetTimer.current !== null) {
        globalThis.clearTimeout(resetTimer.current);
      }
    },
    [],
  );

  return (
    <Button
      aria-live="polite"
      className={className}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void shareLink(title, resolveUrl(url), () => {
          setLabel(SHARE_COPIED_LABEL);
          if (resetTimer.current !== null) {
            globalThis.clearTimeout(resetTimer.current);
          }
          resetTimer.current = globalThis.setTimeout(() => {
            setLabel(SHARE_LABEL);
          }, SHARE_RESET_MS);
        });
      }}
      size={size}
      type="button"
      variant="soft"
    >
      <Share1Icon aria-hidden />
      {label}
    </Button>
  );
};
