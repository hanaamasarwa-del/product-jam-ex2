/*
 * Everything the /design page SAYS, and the two switches for the sections that
 * are left out for now.
 *
 * All the text comes from the Figma export, word for word (the export file is not
 * kept in this repository).
 * To change a word on the page, change it here.
 */

/**
 * Sections of the Figma frame that are NOT on the page for now. Both are built
 * and ready: set one to `true` to put it back.
 *
 * - typographyNote: the "Futura in Heavy and Medium weights" font specimen. It
 *   is a note about the typeface, not product copy.
 * - privacyNote: the Hebrew text about WebSockets, "Ducking" and "PHI" inside a
 *   ring. It reads like a technical note. The designer decides if it belongs.
 */
export const SHOW_SECTIONS = {
  typographyNote: false,
  privacyNote: false,
};

export type ShowSections = typeof SHOW_SECTIONS;

/** A piece of text, which may be bold. The design mixes both in one paragraph. */
export type Run = { text: string; bold?: boolean };

export const copy = {
  logoAlt: "Dentify: less drill, more chill",

  /** The big white card at the top. */
  player: {
    title: "Get started",
    playLabel: "Play Now",
  },

  /** Hebrew, right to left. */
  intro: [
    { text: "Dentify היא " },
    { text: "אפליקציית הזרמת מוזיקה", bold: true },
    { text: ", פודקאסטים וספרי שמע, המותאמת ייחודית " },
    { text: "לרופאי שיניים ולמטופלים", bold: true },
    { text: " בזמן הטיפול" },
  ] satisfies Run[],

  /** The two words under the intro, each with a Hebrew line beneath it. */
  audiences: {
    patientAlt: "Patient",
    patientCaption: "חרדה, פחד, כאב, הסחת דעת",
    dentistAlt: "Dentist",
    dentistCaption: "ריכוז, נינוחות, תקשורת עם המטופל",
  },

  features: {
    patient: {
      label: "patient",
      artAlt: "A patient relaxing in a dentist's chair",
      title: "Tune out the dental drill",
      body: "Block out clinical noise with soothing music and personalized relaxing soundscapes.",
      action: "Get started",
    },
    dentist: {
      label: "Dentist",
      artAlt: "A dentist holding a clipboard",
      title: "Total focus, hands-free",
      body: "Sync music tempo to your procedure and control playback with subtle head gestures.",
      action: "Get started",
    },
  },

  /** The mock of the app's own screen. */
  preview: {
    greeting: "Hello, Dentist",
    avatarAlt: "",
    chips: ["All", "Podcast", "Trending", "Patient", "Dentist"],
    shelfTitle: "Especially for You",
    /** All three cards in the design say this. */
    cardTitle: "Extraction guide step by step",
  },

  credits: {
    hebrew: "עידן דוד שירה דידי",
    latin: "Idan David Shira Didi",
  },

  /** Left out for now (see SHOW_SECTIONS). */
  typographyNote: {
    latinTitle: "Futura",
    latinRuns: [
      { text: "in " },
      { text: "Heavy", bold: true },
      { text: " and Medium weights." },
    ] satisfies Run[],
    latinBody:
      "It aligns seamlessly with the illustrative language, conveying calmness, vitality, and fun in music streaming.",
    hebrewTitle: "היבו",
    hebrewRuns: [
      { text: "במשקלים " },
      { text: "כבד", bold: true },
      { text: " ובינוני" },
    ] satisfies Run[],
    hebrewBody:
      "משתלב באופן מושלם עם השפה האיורית ומשדר רוגע חיוניות וכיף לתוך חווית המוסיקה לכלל המאזינים.",
  },

  /** Left out for now (see SHOW_SECTIONS). */
  privacyNote:
    "המערכת מבוססת על תקשורת WebSockets מושהית לזמן אמת עבור הנמכת שמע (Ducking) ואותות מצוקה שקטים, ושומרת על פרטיות מלאה ללא אגירת מידע רפואי (PHI).",
};
