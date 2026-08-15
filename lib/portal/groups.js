// Dot One Media portal - service-group definitions (labels, colors, icons).
import { Film, Image as ImageIcon, Music, Landmark } from "lucide-react";

export const GROUPS = {
  video: { label: "Video", color: "#e23b2e", soft: "#e23b2e", bg: "color-mix(in srgb, #e23b2e 11%, var(--d1-paper,#fff))", border: "color-mix(in srgb, #e23b2e 30%, var(--d1-paper,#fff))", text: "color-mix(in srgb, #e23b2e 72%, var(--d1-ink,#1a1a17))", Icon: Film },
  photo: { label: "Photography", color: "#2f74c0", soft: "#5b9bd5", bg: "color-mix(in srgb, #2f74c0 11%, var(--d1-paper,#fff))", border: "color-mix(in srgb, #2f74c0 30%, var(--d1-paper,#fff))", text: "color-mix(in srgb, #2f74c0 74%, var(--d1-ink,#1a1a17))", Icon: ImageIcon },
  music: { label: "Music", color: "#9163cc", soft: "#a586d6", bg: "color-mix(in srgb, #9163cc 12%, var(--d1-paper,#fff))", border: "color-mix(in srgb, #9163cc 30%, var(--d1-paper,#fff))", text: "color-mix(in srgb, #9163cc 74%, var(--d1-ink,#1a1a17))", Icon: Music },
  government: { label: "Government", color: "#586b2e", soft: "#6b7d40", bg: "color-mix(in srgb, #586b2e 13%, var(--d1-paper,#fff))", border: "color-mix(in srgb, #586b2e 32%, var(--d1-paper,#fff))", text: "color-mix(in srgb, #586b2e 76%, var(--d1-ink,#1a1a17))", Icon: Landmark },
};

export const GROUP_KEYS = ["photo", "video", "music", "government"];

