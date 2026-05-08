"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { Announcement } from "@/lib/types";

interface DisplayAnnouncementProps {
  title: string;
  text: string;
  bgColor?: string | null;
  textColor?: string | null;
}

function getAnnouncementStyle(bgColor?: string | null, textColor?: string | null) {
  return {
    "--announcement-bg-color": bgColor || "#123a70",
    "--announcement-text-color": textColor || "#ffffff",
  } as CSSProperties & Record<"--announcement-bg-color" | "--announcement-text-color", string>;
}

export function DisplayAnnouncement({ title, text, bgColor, textColor }: DisplayAnnouncementProps) {
  return (
    <div className="tv-legacy tv-panel tv-announcement" style={getAnnouncementStyle(bgColor, textColor)}>
      <div className="tv-announcement-inner">
        <h1 className="tv-announcement-title">{title}</h1>
        <p className="tv-announcement-text">{text}</p>
      </div>
    </div>
  );
}

interface DisplayAnnouncementQueueProps {
  announcements: Announcement[];
  fallbackTitle: string;
  fallbackText: string;
  onBackgroundColorChange?: (color: string) => void;
}

export function DisplayAnnouncementQueue({
  announcements,
  fallbackTitle,
  fallbackText,
  onBackgroundColorChange,
}: DisplayAnnouncementQueueProps) {
  const activeAnnouncements = useMemo(
    () => announcements.filter((announcement) => announcement.is_active),
    [announcements],
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentIndex(0);
    }, 0);

    return () => clearTimeout(timer);
  }, [activeAnnouncements.length]);

  useEffect(() => {
    if (activeAnnouncements.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % activeAnnouncements.length);
    }, 12000);

    return () => clearInterval(timer);
  }, [activeAnnouncements.length]);

  const currentAnnouncement = activeAnnouncements[currentIndex];
  const currentBackgroundColor = currentAnnouncement?.bg_color || "#123a70";

  useEffect(() => {
    onBackgroundColorChange?.(currentBackgroundColor);
  }, [currentBackgroundColor, onBackgroundColorChange]);

  if (!currentAnnouncement) {
    return <DisplayAnnouncement title={fallbackTitle} text={fallbackText} bgColor={currentBackgroundColor} />;
  }

  return (
    <DisplayAnnouncement
      title={currentAnnouncement.title}
      text={currentAnnouncement.text}
      bgColor={currentAnnouncement.bg_color}
      textColor={currentAnnouncement.text_color}
    />
  );
}
