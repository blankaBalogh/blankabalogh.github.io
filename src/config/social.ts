import type { SocialLink } from "../types";

export const SOCIALS: SocialLink[] = [
    {
        name: "Github",
        href: "https://github.com/blankaBalogh",
        linkTitle: `Github`,
        isActive: true,
    },
    {
        name: "Mail",
        href: "mailto:blanka.balogh@meteo.fr",
        linkTitle: `mail`,
        isActive: true,
    },
    {
        name: "Google Scholar",
        href: "https://scholar.google.com/citations?user=FjASrHsAAAAJ&hl=fr&oi=ao",
        linkTitle: `Google Scholar`,
        isActive: true,
    },
    {
        name: "ORCID",
        href: "https://orcid.org/0000-0002-6556-526X",
        linkTitle: `ORCID`,
        isActive: true,
    },
    {
        name: "LinkedIn",
        href: "https://www.linkedin.com/in/blanka-balogh-46a152125/",
        linkTitle: `LinkedIn`,
        isActive: true,
    },
    {
        name: "CV",
        href: "/cv_balogh_may26.pdf",
        linkTitle: "Download CV",
        isActive: true,
    },
];

export const SOCIAL_ICONS: Record<string, string> = {
    Github: "Github",
    Mail: "Mail",
    Linkedin: "LinkedIn",
    "Google Scholar": "GoogleScholar",
    ORCID: "ORCID",
    RSS: "RSS",
    CV: "mdi:file-pdf-box",
};
