/**
 * Full-screen viewer for post images and videos.
 *
 * Built on the native ``<dialog>`` (``showModal``): it renders in the
 * browser top layer, traps focus, and closes on Escape without a portal.
 *
 * Controls: prev/next buttons (hidden below the 520px / ``xs`` breakpoint),
 * ←/→ keys, horizontal swipe on any screen size, a thumbnail strip, and
 * close (button, Escape, or a click on the dark area). Navigation wraps
 * around. Media always fits the viewport — no zoom.
 */
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Cross2Icon,
  PlayIcon,
} from "@radix-ui/react-icons";
import { IconButton, Text } from "@radix-ui/themes";
import type { KeyboardEvent, PointerEvent, RefObject } from "react";
import { useEffect, useRef } from "react";

import type { Media } from "~/types/posts";

/** Horizontal travel (px) that counts as a swipe. */
const SWIPE_THRESHOLD = 50;

type LightboxProps = {
  items: Media[];
  /** Open item, or ``null`` when the viewer is closed. */
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

/** Open/close the dialog with ``isOpen`` and lock page scroll meanwhile. */
const useModalDialog = (
  dialogRef: RefObject<HTMLDialogElement | null>,
  isOpen: boolean,
) => {
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [dialogRef, isOpen]);

  // A modal dialog does not stop the page behind it from scrolling.
  useEffect(() => {
    if (!isOpen) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [isOpen]);
};

type ToolbarProps = {
  position: number;
  count: number;
  onClose: () => void;
};

const LightboxToolbar = ({ position, count, onClose }: ToolbarProps) => (
  <div className="app-lightbox-toolbar">
    <Text className="app-lightbox-caption" size="3" weight="medium">
      {count > 1 ? `${position + 1} / ${count}` : null}
    </Text>
    <IconButton
      aria-label="Close"
      color="gray"
      onClick={onClose}
      size="3"
      variant="ghost"
    >
      <Cross2Icon height="22" width="22" />
    </IconButton>
  </div>
);

type StageProps = {
  item: Media;
  hasMany: boolean;
  onStep: (step: number) => void;
  onClose: () => void;
};

const LightboxStage = ({ item, hasMany, onStep, onClose }: StageProps) => {
  const swipeStartX = useRef<number | null>(null);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // Nav / close handle their own clicks; do not start a swipe.
    if ((event.target as HTMLElement).closest("button, a")) {
      swipeStartX.current = null;
      return;
    }
    swipeStartX.current = event.clientX;
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipeStartX.current;
    swipeStartX.current = null;
    if (start === null || !hasMany) return;
    const distance = event.clientX - start;
    if (Math.abs(distance) >= SWIPE_THRESHOLD) onStep(distance < 0 ? 1 : -1);
  };

  const handlePointerCancel = () => {
    swipeStartX.current = null;
  };

  return (
    // Clicks on the empty area around the media close the viewer.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- Escape and the close button cover keyboard users
    <div
      className="app-lightbox-stage"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {item.kind === "image" ? (
        <img
          alt={item.filename}
          className="app-lightbox-media"
          draggable={false}
          key={item.id}
          src={item.url}
        />
      ) : (
        // eslint-disable-next-line jsx-a11y/media-has-caption -- uploads have no caption tracks
        <video
          autoPlay
          className="app-lightbox-media"
          controls
          key={item.id}
          playsInline
          src={item.url}
        />
      )}

      {hasMany ? (
        <>
          <IconButton
            aria-label="Previous"
            className="app-lightbox-nav app-lightbox-nav-prev"
            color="gray"
            onClick={() => onStep(-1)}
            radius="full"
            size="3"
            variant="soft"
          >
            <ChevronLeftIcon height="20" width="20" />
          </IconButton>
          <IconButton
            aria-label="Next"
            className="app-lightbox-nav app-lightbox-nav-next"
            color="gray"
            onClick={() => onStep(1)}
            radius="full"
            size="3"
            variant="soft"
          >
            <ChevronRightIcon height="20" width="20" />
          </IconButton>
        </>
      ) : null}
    </div>
  );
};

type ThumbsProps = {
  items: Media[];
  position: number;
  onSelect: (index: number) => void;
};

const LightboxThumbs = ({ items, position, onSelect }: ThumbsProps) => {
  const thumbsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    thumbsRef.current
      ?.querySelector('[aria-current="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [position]);

  return (
    <div className="app-lightbox-thumbs" ref={thumbsRef}>
      {items.map((item, itemIndex) => (
        <button
          aria-current={itemIndex === position}
          aria-label={`Show ${item.filename}`}
          className="app-lightbox-thumb"
          key={item.id}
          onClick={() => onSelect(itemIndex)}
          type="button"
        >
          {item.kind === "image" ? (
            <img alt="" loading="lazy" src={item.url} />
          ) : (
            <>
              <video muted preload="metadata" src={item.url} />
              <PlayIcon className="app-lightbox-thumb-play" />
            </>
          )}
        </button>
      ))}
    </div>
  );
};

export const Lightbox = ({
  items,
  index,
  onIndexChange,
  onClose,
}: LightboxProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const position = index ?? 0;
  const current = index === null ? undefined : items.at(index);
  const hasMany = items.length > 1;

  useModalDialog(dialogRef, current !== undefined);

  // Warm the cache for the neighbours so prev/next feel instant.
  useEffect(() => {
    if (index === null) return;
    for (const offset of [-1, 1]) {
      const neighbour = items.at((index + offset) % items.length);
      if (neighbour?.kind === "image") new Image().src = neighbour.url;
    }
  }, [index, items]);

  const step = (offset: number) => {
    if (!hasMany) return;
    onIndexChange((position + offset + items.length) % items.length);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    switch (event.key) {
      case "ArrowLeft": {
        step(-1);
        break;
      }
      case "ArrowRight": {
        step(1);
        break;
      }
      default: {
        return;
      }
    }
    event.preventDefault();
  };

  return (
    // Escape fires ``cancel`` then ``close``; ``onClose`` syncs React state.
    <dialog
      aria-label="Media viewer"
      className="app-lightbox"
      onClose={onClose}
      onKeyDown={handleKeyDown}
      ref={dialogRef}
    >
      {current ? (
        <>
          <LightboxToolbar
            count={items.length}
            onClose={onClose}
            position={position}
          />
          <LightboxStage
            hasMany={hasMany}
            item={current}
            onClose={onClose}
            onStep={step}
          />
          {hasMany ? (
            <LightboxThumbs
              items={items}
              onSelect={onIndexChange}
              position={position}
            />
          ) : null}
        </>
      ) : null}
    </dialog>
  );
};
