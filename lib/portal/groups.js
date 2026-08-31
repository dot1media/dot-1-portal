// Dot One Media portal - service-group definitions (labels, colors, icons).
import { Film, Image as ImageIcon, Music, Landmark } from "lucide-react";

export const GROUPS = {
  video: { label: "Video", color: "#b81616", soft: "#b81616", bg: "color-mix(in srgb, #b81616 10%, var(--d1-paper,#fff))", border: "color-mix(in srgb, #b81616 30%, var(--d1-paper,#fff))", text: "color-mix(in srgb, #b81616 74%, var(--d1-ink,#1a1a17))", Icon: Film },
  photo: { label: "Photography", color: "#4a90d9", soft: "#a9cdee", bg: "color-mix(in srgb, #4a90d9 6%, #ffffff)", border: "color-mix(in srgb, #4a90d9 20%, #ffffff)", text: "color-mix(in srgb, #4a90d9 82%, #16181d)", Icon: ImageIcon },
  music: { label: "Music", color: "#9163cc", soft: "#a586d6", bg: "color-mix(in srgb, #9163cc 12%, var(--d1-paper,#fff))", border: "color-mix(in srgb, #9163cc 30%, var(--d1-paper,#fff))", text: "color-mix(in srgb, #9163cc 74%, var(--d1-ink,#1a1a17))", Icon: Music },
  government: { label: "Government", color: "#586b2e", soft: "#6b7d40", bg: "color-mix(in srgb, #586b2e 13%, var(--d1-paper,#fff))", border: "color-mix(in srgb, #586b2e 32%, var(--d1-paper,#fff))", text: "color-mix(in srgb, #586b2e 76%, var(--d1-ink,#1a1a17))", Icon: Landmark },
};

export const GROUP_KEYS = ["photo", "video", "music", "government"];

