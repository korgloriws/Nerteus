export type SocialNetwork = {
  id: "instagram" | "youtube" | "tiktok";
  label: string;
  href: string;
};

export const SOCIAL_LINKS: SocialNetwork[] = [
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/nerteusoficial/",
  },
  {
    id: "youtube",
    label: "YouTube",
    href: "https://www.youtube.com/@nerteus",
  },
  {
    id: "tiktok",
    label: "TikTok",
    href: "https://www.tiktok.com/@nerteusoficial",
  },
];
