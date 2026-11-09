/**
 * Post attachments below the body: an image/video grid, then audio tracks.
 *
 * Grid tiles are square crops. A tile opens the ``Lightbox`` viewer on the
 * same page. The cover is not passed here; it is only shown on the posts list.
 */
import { PlayIcon } from "@radix-ui/react-icons";
import { Text } from "@radix-ui/themes";
import { useState } from "react";

import { Lightbox } from "./lightbox";

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
        <div className="app-post-gallery-audio" key={item.id}>
          <Text as="p" size="2">
            {item.filename}
          </Text>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption -- uploads have no caption tracks */}
          <audio controls preload="none" src={item.url} />
        </div>
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
