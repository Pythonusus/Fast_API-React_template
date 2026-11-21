/**
 * Post attachments below the body: an image/video grid, then audio rows.
 *
 * Grid tiles are square crops. A tile opens the ``Lightbox`` viewer on the
 * same page. Audio is one row: play/pause, the name, then the rest of
 * the controls. A long name wraps so the controls stay on that row. The
 * cover is not passed here; it is only shown on the posts list.
 */
import { PlayIcon } from "@radix-ui/react-icons";
import { useState } from "react";

import { Lightbox } from "./lightbox";

import { AudioTrack } from "~/components/ui/audio-player";
import type { Media } from "~/types/posts";

import "./post-gallery.css";

type PostGalleryProps = {
  media: Media[];
};

export const PostGallery = ({ media }: PostGalleryProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const visual = media.filter((item) => item.kind !== "audio");
  const audio = media.filter((item) => item.kind === "audio");

  if (media.length === 0) {
    return null;
  }

  return (
    <section aria-label="Attachments" className="app-post-gallery">
      {visual.length > 0 ? (
        <div className="app-post-gallery-grid">
          {visual.map((item, index) => (
            <button
              aria-label={`Open ${item.filename}`}
              className="app-post-gallery-tile"
              key={item.id}
              onClick={() => setOpenIndex(index)}
              type="button"
            >
              {item.kind === "image" ? (
                <img alt="" loading="lazy" src={item.url} />
              ) : (
                <>
                  <video muted preload="metadata" src={item.url} />
                  <span aria-hidden className="app-post-gallery-play">
                    <PlayIcon height="24" width="24" />
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      ) : null}

      {audio.map((item) => (
        <AudioTrack key={item.id} name={item.filename} src={item.url} />
      ))}

      <Lightbox
        index={openIndex}
        items={visual}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
      />
    </section>
  );
};
