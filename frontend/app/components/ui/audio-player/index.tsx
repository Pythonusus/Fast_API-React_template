/**
 * Public audio controls.
 *
 * The browser player has no prop for a vertical volume slider, and its
 * overflow menu includes playback speed. This bar keeps play, time, seek,
 * and volume. The volume track is positioned over the speaker icon so
 * opening it does not change the row.
 */
import {
  PauseIcon,
  PlayIcon,
  SpeakerLoudIcon,
  SpeakerModerateIcon,
  SpeakerOffIcon,
  SpeakerQuietIcon,
} from "@radix-ui/react-icons";
import { IconButton, Slider, Text } from "@radix-ui/themes";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";

import "./audio-player.css";

type AudioPlayerProps = {
  src: string;
  className?: string;
  /** When set, the row is the gallery card and this is its label. */
  name?: string;
};

type AudioTrackProps = {
  src: string;
  /** File name, with or without an extension. */
  name: string;
};

/** Drop a trailing extension. ``track.mp3`` becomes ``track``. */
export const audioLabel = (filename: string) => {
  const withoutExtension = filename.replace(/\.[^.]+$/, "");
  return withoutExtension || filename;
};

/**
 * Name for an ``<audio>`` embed. Prefers ``data-filename``; otherwise the
 * last path segment of the URL.
 */
export const audioNameFromElement = (audio: HTMLAudioElement) => {
  const named = audio.dataset.filename;
  if (named) {
    return named;
  }

  const src = audio.currentSrc || audio.getAttribute("src") || "";
  const path = src.split(/[?#]/, 1)[0] ?? "";
  const file = decodeURIComponent(path.split("/").pop() ?? "");
  return file || "Audio";
};

/** Gallery row and the same row for audio embedded in a post body. */
export const AudioTrack = ({ src, name }: AudioTrackProps) => (
  <AudioPlayer name={name} src={src} />
);

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;

  return `${minutes}:${rest.toString().padStart(2, "0")}`;
};

const VolumeIcon = ({ muted, volume }: { muted: boolean; volume: number }) => {
  if (muted || volume === 0) {
    return <SpeakerOffIcon />;
  }

  if (volume < 0.34) {
    return <SpeakerQuietIcon />;
  }

  if (volume < 0.67) {
    return <SpeakerModerateIcon />;
  }

  return <SpeakerLoudIcon />;
};

export const AudioPlayer = ({ src, className, name }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const seeking = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [volumePinned, setVolumePinned] = useState(false);

  useEffect(() => {
    if (!volumePinned) {
      return;
    }

    const close = (event: Event) => {
      const target = event.target;
      if (
        target instanceof Node &&
        volumeRef.current &&
        !volumeRef.current.contains(target)
      ) {
        setVolumePinned(false);
      }
    };

    document.addEventListener("pointerdown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
    };
  }, [volumePinned]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (audio.paused) {
      void audio.play();
      return;
    }

    audio.pause();
  };

  const seek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.currentTime = value;
    setTime(value);
    seeking.current = false;
  };

  const changeVolume = (value: number) => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const next = value / 100;
    audio.volume = next;
    audio.muted = next === 0;
    setVolume(next);
    setMuted(next === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.muted = !audio.muted;
    setMuted(audio.muted);
  };

  const onVolumePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "touch") {
      return;
    }

    event.preventDefault();
    setVolumePinned((open) => !open);
  };

  const classes = ["app-audio-player", className].filter(Boolean).join(" ");
  const volumeClasses = ["app-audio-volume", volumePinned ? "is-open" : ""]
    .filter(Boolean)
    .join(" ");
  const playButton = (
    <IconButton
      aria-label={playing ? "Pause" : "Play"}
      className={name ? "app-audio-play" : "app-audio-icon"}
      color="gray"
      onClick={togglePlay}
      size="2"
      variant={name ? "soft" : "ghost"}
    >
      {playing ? <PauseIcon /> : <PlayIcon />}
    </IconButton>
  );
  const controls = (
    <div className={name ? `${classes} app-audio-track-player` : classes}>
      {name ? null : playButton}
      <Text className="app-audio-time" color="gray" size="1">
        {formatTime(time)} / {formatTime(duration)}
      </Text>
      <Slider
        aria-label="Playback position"
        className="app-audio-seek"
        max={duration || 1}
        onValueChange={(value) => {
          seeking.current = true;
          setTime(value[0] ?? 0);
        }}
        onValueCommit={(value) => {
          seek(value[0] ?? 0);
        }}
        size="1"
        value={[Math.min(time, duration || 1)]}
      />
      <div className={volumeClasses} ref={volumeRef}>
        <div className="app-audio-volume-pop">
          <Slider
            aria-label="Volume"
            className="app-audio-volume-slider"
            max={100}
            onValueChange={(value) => {
              changeVolume(value[0] ?? 0);
            }}
            orientation="vertical"
            size="1"
            value={[muted ? 0 : Math.round(volume * 100)]}
          />
        </div>
        <IconButton
          aria-label={muted || volume === 0 ? "Unmute" : "Mute"}
          className="app-audio-icon"
          color="gray"
          onClick={toggleMute}
          onPointerDown={onVolumePointerDown}
          size="1"
          variant="ghost"
        >
          <VolumeIcon muted={muted} volume={volume} />
        </IconButton>
      </div>
    </div>
  );

  const element = (
    // eslint-disable-next-line jsx-a11y/media-has-caption -- uploads have no caption tracks
    <audio
      className="app-audio-element"
      onDurationChange={(event) => {
        setDuration(event.currentTarget.duration);
      }}
      onEnded={() => {
        setPlaying(false);
      }}
      onPause={() => {
        setPlaying(false);
      }}
      onPlay={() => {
        setPlaying(true);
      }}
      onTimeUpdate={(event) => {
        if (!seeking.current) {
          setTime(event.currentTarget.currentTime);
        }
      }}
      preload="metadata"
      ref={audioRef}
      src={src}
    />
  );

  if (!name) {
    return (
      <>
        {element}
        {controls}
      </>
    );
  }

  return (
    <div className="app-audio-track">
      {element}
      {playButton}
      <Text as="p" className="app-audio-track-name" size="2">
        {audioLabel(name)}
      </Text>
      {controls}
    </div>
  );
};
