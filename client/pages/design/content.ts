/*
 * Everything the /design page SAYS, and the two switches for the typeface and
 * privacy sections.
 *
 * All the text comes from the Figma export, word for word (the export file is not
 * kept in this repository).
 * To change a word on the page, change it here.
 */

/**
 * Two sections of the Figma frame, which are part of the design:
 *
 * - typographyNote: "Futura in Heavy and Medium weights", in English and
 *   Hebrew, with the curved line running behind it.
 * - privacyNote: the Hebrew text about WebSockets, "Ducking" and "PHI" inside a
 *   circle.
 *
 * Both are ON. The switches stay so either can be hidden again without touching
 * the page code: set one to `false`.
 */
export const SHOW_SECTIONS = {
  typographyNote: true,
  privacyNote: true,
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

  /** The typeface section (see SHOW_SECTIONS). */
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

  /** The typeface section (see SHOW_SECTIONS). */
  privacyNote:
    "המערכת מבוססת על תקשורת WebSockets מושהית לזמן אמת עבור הנמכת שמע (Ducking) ואותות מצוקה שקטים, ושומרת על פרטיות מלאה ללא אגירת מידע רפואי (PHI).",
};
