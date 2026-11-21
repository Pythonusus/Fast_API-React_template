/**
 * Renders post body HTML from the API (TinyMCE / admin output).
 *
 * Uses the shared ``app-inner-html`` class from ``~/styles/inner-html.css``
 * so other HTML-bearing components can reuse the same prose rules. That
 * stylesheet also fits embedded S3 ``img`` / ``video`` / ``audio`` to the
 * column width.
 *
 * Markup comes from the trusted admin editor. Do not pass unsanitized or
 * untrusted HTML here.
 *
 * Public audio is replaced with the same ``AudioTrack`` row as the gallery.
 * Video only hides the browser download control. The admin page renders
 * the same HTML without this step.
 */

import { useLayoutEffect, useRef } from "react";
import { createRoot } from "react-dom/client";

import { AudioTrack, audioNameFromElement } from "~/components/ui/audio-player";

export type PostContentProps = {
  html: string | null | undefined;
  className?: string;
};

export const PostContent = ({ html, className }: PostContentProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) {
      return;
    }

    for (const video of root.querySelectorAll("video")) {
      video.setAttribute("controlsList", "nodownload");
    }

    const mounts: Array<{
      host: HTMLDivElement;
      audio: HTMLAudioElement;
      reactRoot: ReturnType<typeof createRoot>;
    }> = [];

    for (const audio of root.querySelectorAll("audio")) {
      const source = audio.querySelector("source");
      const src =
        audio.getAttribute("src") ?? source?.getAttribute("src") ?? "";
      const host = document.createElement("div");
      host.className = "app-audio-host";
      const reactRoot = createRoot(host);
      reactRoot.render(
        <AudioTrack name={audioNameFromElement(audio)} src={src} />,
      );
      audio.replaceWith(host);
      mounts.push({ host, audio, reactRoot });
    }

    return () => {
      for (const mount of mounts) {
        mount.reactRoot.unmount();
        if (mount.host.isConnected) {
          mount.host.replaceWith(mount.audio);
        }
      }
    };
  }, [html]);

  if (!html) {
    return null;
  }

  const classes = ["app-inner-html", className].filter(Boolean).join(" ");

  return (
    <div
      className={classes}
      dangerouslySetInnerHTML={{ __html: html }}
      ref={ref}
    />
  );
};
