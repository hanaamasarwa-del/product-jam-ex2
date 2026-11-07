import { DirectionProvider } from "@base-ui/react/direction-provider";
import { useCallback, useState, type ReactNode } from "react";
import {
  AlertDialog,
  Avatar,
  Button,
  Card,
  Checkbox,
  Combobox,
  DatePicker,
  Dialog,
  Field,
  IconButton,
  Input,
  Menu,
  Popover,
  RadioGroup,
  Select,
  Separator,
  Spinner,
  Switch,
  Tabs,
  Textarea,
  Tooltip,
  useToast,
} from "../../components";
import { DIRECTION } from "../../lib/config";
import styles from "./ComponentsPage.module.css";

/**
 * The component gallery: every component, in its variants and states.
 *
 * This page is the standing test for two things that are easy to break
 * without noticing - right-to-left layout, and keyboard access. Flip the
 * direction toggle and tab through the whole page after changing anything
 * in client/components/ or client/styles/tokens.css.
 *
 * It is hidden when VITE_SHOW_DEMOS=false, and it is loaded as a separate
 * chunk, so it costs real visitors nothing.
 */
export default function ComponentsPage() {
  const [direction, setDirection] = useState<"rtl" | "ltr">(DIRECTION);

  return (
    <DirectionProvider direction={direction}>
      <div dir={direction} className={styles.page}>
        <header className={styles.header}>
          <div className={styles.intro}>
            <h1>Component Library</h1>
            <p>
              Every component in the app, in all its variants and states. This
              page is the standing check for text direction and keyboard
              navigation.
            </p>
          </div>
          <div className={styles.controls}>
            <Switch
              checked={direction === "rtl"}
              onCheckedChange={(checked) =>
                setDirection(checked ? "rtl" : "ltr")
              }
            >
              {direction === "rtl"
                ? "Right to left (RTL)"
                : "Left to right (LTR)"}
            </Switch>
          </div>
        </header>

        <nav className={styles.toc} aria-label="On this page">
          {SECTIONS.map((id) => (
            <a key={id} href={`#${id}`}>
              {id}
            </a>
          ))}
        </nav>

        <TokensSection />
        <ButtonsSection />
        <FormsSection />
        <SelectionSection />
        <OverlaysSection />
        <FeedbackSection />
        <LayoutSection />
        <HtmlSection />
      </div>
    </DirectionProvider>
  );
}

const SECTIONS = [
  "tokens",
  "buttons",
  "forms",
  "selection",
  "overlays",
  "feedback",
  "layout",
  "html",
];

function Section({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {note ? <p className={styles.sectionNote}>{note}</p> : null}
      {children}
    </section>
  );
}

/*
  The token reference.

  The names below are exactly the ones in client/styles/tokens.css. If you add
  a token there, add it here too - this page is how everyone else finds out it
  exists.
*/
const AUTHORED_COLORS = [
  "--color-bg",
  "--color-surface",
  "--color-text",
  "--color-text-muted",
  "--color-border",
  "--color-accent",
  "--color-danger",
  "--color-success",
];

const DERIVED_COLORS = [
  "--color-surface-hover",
  "--color-surface-active",
  "--color-border-strong",
  "--color-text-disabled",
  "--color-text-on-accent",
  "--color-accent-hover",
  "--color-accent-active",
  "--color-danger-hover",
  "--color-danger-subtle",
  "--color-success-subtle",
  "--color-overlay",
];

const SPACES = [
  "--space-1",
  "--space-2",
  "--space-3",
  "--space-4",
  "--space-6",
  "--space-8",
];

const RADII = ["--radius-sm", "--radius-md", "--radius-lg", "--radius-full"];

const TEXT_SIZES = [
  "--text-xs",
  "--text-sm",
  "--text-base",
  "--text-lg",
  "--text-xl",
];

const SHADOWS = ["--shadow-md", "--shadow-lg"];

const FONTS = ["--font-body", "--font-titles", "--font-mono"];

const SIZE_TOKENS = [...SPACES, ...RADII, ...TEXT_SIZES];

/**
 * Reads what a CSS variable actually holds, as the browser sees it.
 *
 * Works for plain values like `1rem`. It does NOT work for the colours,
 * because half of them are `color-mix(...)` expressions and this would hand
 * back that expression as text - see ColorSwatch below.
 */
function useTokenValues(names: string[]) {
  const [values] = useState(() => {
    const root = getComputedStyle(document.documentElement);
    return Object.fromEntries(
      names.map((n) => [n, root.getPropertyValue(n).trim()]),
    );
  });

  return values;
}

/**
 * Turns any colour the browser hands back into a plain hex code.
 *
 * The derived tokens come back as `oklab(0.42 0.05 -0.19)`, which is correct
 * but unreadable. Painting the colour onto a one-pixel canvas and reading
 * that pixel back turns any syntax into plain red/green/blue.
 */
function toHex(color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  const ctx = canvas.getContext("2d");
  if (!ctx) return color;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);

  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  const hex = [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");

  // Only --color-overlay is see-through; say so rather than lying with a flat
  // colour.
  return a === 255 ? `#${hex}` : `#${hex} · ${Math.round((a / 255) * 100)}%`;
}

/**
 * One colour, with the value it resolves to.
 *
 * The derived tokens are written as `color-mix(...)`, so asking the variable
 * for its value just returns that text. Instead we paint the chip, then ask
 * the browser what colour the chip ended up - which is the real answer.
 */
function ColorSwatch({ name }: { name: string }) {
  const [resolved, setResolved] = useState("");

  // Runs once, the moment the chip lands in the page.
  const measure = useCallback((chip: HTMLSpanElement | null) => {
    if (chip) setResolved(toHex(getComputedStyle(chip).backgroundColor));
  }, []);

  return (
    <div className={styles.swatch}>
      <span
        ref={measure}
        className={styles.swatchChip}
        style={{ backgroundColor: `var(${name})` }}
      />
      {/* dir="ltr" because a CSS variable name is code, not Hebrew
          text - without it the leading "--" jumps to the far end. */}
      <span className={styles.swatchText}>
        <code dir="ltr">{name}</code>
        <code dir="ltr" className={styles.tokenValue}>
          {resolved}
        </code>
      </span>
    </div>
  );
}

function TokensSection() {
  const sizes = useTokenValues(SIZE_TOKENS);

  return (
    <Section
      id="tokens"
      title="Tokens"
      note="Everything the components are built from. It is all defined in client/styles/tokens.css, the only file you need to edit to change how the app looks."
    >
      <h3 className={styles.subTitle}>The eight colours you change</h3>
      <p className={styles.subNote}>
        These are the only values written by hand. Change them and everything
        else follows.
      </p>
      <div className={styles.swatches}>
        {AUTHORED_COLORS.map((name) => (
          <ColorSwatch key={name} name={name} />
        ))}
      </div>

      <h3 className={styles.subTitle}>Colours derived from them</h3>
      <p className={styles.subNote}>
        The browser works these out from the eight above, with color-mix. No
        need to touch them.
      </p>
      <div className={styles.swatches}>
        {DERIVED_COLORS.map((name) => (
          <ColorSwatch key={name} name={name} />
        ))}
      </div>

      <h3 className={styles.subTitle}>Spacing</h3>
      <p className={styles.subNote}>
        A scale, not arbitrary numbers. Pick the closest step.
      </p>
      <div className={styles.scale}>
        {SPACES.map((name) => (
          <div key={name} className={styles.scaleRow}>
            <span
              className={styles.bar}
              style={{ inlineSize: `var(${name})` }}
            />
            <code dir="ltr">{name}</code>
            <code dir="ltr" className={styles.tokenValue}>
              {sizes[name]}
            </code>
          </div>
        ))}
      </div>

      <h3 className={styles.subTitle}>Rounded corners</h3>
      <div className={styles.row}>
        {RADII.map((name) => (
          <div key={name} className={styles.radiusItem}>
            <span
              className={styles.radiusBox}
              style={{ borderRadius: `var(${name})` }}
            />
            <code dir="ltr">{name}</code>
          </div>
        ))}
      </div>

      <h3 className={styles.subTitle}>Text sizes</h3>
      <div className={styles.scale}>
        {TEXT_SIZES.map((name) => (
          <div key={name} className={styles.scaleRow}>
            <span
              className={styles.sampleText}
              style={{ fontSize: `var(${name})` }}
            >
              Sample text
            </span>
            <code dir="ltr">{name}</code>
            <code dir="ltr" className={styles.tokenValue}>
              {sizes[name]}
            </code>
          </div>
        ))}
      </div>

      <h3 className={styles.subTitle}>Fonts</h3>
      <div className={styles.scale}>
        {FONTS.map((name) => (
          <div key={name} className={styles.scaleRow}>
            <span
              className={styles.sampleText}
              style={{ fontFamily: `var(${name})` }}
            >
              Sample text 123
            </span>
            <code dir="ltr">{name}</code>
          </div>
        ))}
      </div>

      <h3 className={styles.subTitle}>Shadows</h3>
      <div className={styles.row}>
        {SHADOWS.map((name) => (
          <div key={name} className={styles.radiusItem}>
            <span
              className={styles.shadowBox}
              style={{ boxShadow: `var(${name})` }}
            />
            <code dir="ltr">{name}</code>
          </div>
        ))}
      </div>
    </Section>
  );
}

function ButtonsSection() {
  return (
    <Section id="buttons" title="Buttons">
      <div className={styles.row}>
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </div>
      <br />
      <div className={styles.row}>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
      <br />
      <div className={styles.row}>
        <Button disabled>Disabled</Button>
        <Button loading>Loading</Button>
        <Tooltip content="Deletes permanently">
          <IconButton label="Delete" variant="danger">
            <TrashIcon />
          </IconButton>
        </Tooltip>
        <IconButton label="Edit" variant="secondary">
          <PencilIcon />
        </IconButton>
      </div>
    </Section>
  );
}

function FormsSection() {
  const [text, setText] = useState("");
  const [date, setDate] = useState<Date | undefined>();

  return (
    <Section
      id="forms"
      title="Form fields"
      note="Notice that the red message appears below the field, and the border changes colour."
    >
      <div className={styles.stack}>
        <Field label="Full name" description="What should we call you">
          <Input
            placeholder="Noa Cohen"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </Field>

        <Field label="Email" error="The email address is not valid">
          <Input type="email" defaultValue="not-an-email" />
        </Field>

        <Field label="Disabled field">
          <Input disabled value="Cannot be edited" readOnly />
        </Field>

        <Field label="Description" description="Up to 2000 characters">
          <Textarea placeholder="A few words about the event..." />
        </Field>

        <Field label="Date">
          <DatePicker value={date} onValueChange={setDate} />
        </Field>

        <Field label="Category">
          <Select
            options={[
              { value: "event", label: "Event" },
              { value: "workshop", label: "Workshop" },
              { value: "meeting", label: "Meeting" },
            ]}
          />
        </Field>

        <Field label="City" description="Type to filter">
          <Combobox
            options={[
              { value: "jm", label: "Jerusalem" },
              { value: "tlv", label: "Tel Aviv" },
              { value: "hfa", label: "Haifa" },
              { value: "bsh", label: "Beersheba" },
            ]}
          />
        </Field>
      </div>
    </Section>
  );
}

function SelectionSection() {
  const [checked, setChecked] = useState(true);
  const [on, setOn] = useState(false);
  const [choice, setChoice] = useState("a");

  return (
    <Section id="selection" title="Selection">
      <div className={styles.stack}>
        <Checkbox checked={checked} onCheckedChange={setChecked}>
          Checked
        </Checkbox>
        <Checkbox>Unchecked</Checkbox>
        <Checkbox disabled>Disabled</Checkbox>

        <Separator />

        <Switch checked={on} onCheckedChange={setOn}>
          Email notifications
        </Switch>
        <Switch disabled>Disabled</Switch>

        <Separator />

        <RadioGroup value={choice} onValueChange={(v) => setChoice(String(v))}>
          <RadioGroup.Option value="a">Option A</RadioGroup.Option>
          <RadioGroup.Option value="b">Option B</RadioGroup.Option>
          <RadioGroup.Option value="c" disabled>
            Option C (disabled)
          </RadioGroup.Option>
        </RadioGroup>
      </div>
    </Section>
  );
}

function OverlaysSection() {
  return (
    <Section
      id="overlays"
      title="Overlays"
      note="Check that they open on the correct side when you switch direction, and that Escape closes them."
    >
      <div className={styles.row}>
        <Dialog
          trigger={<Button variant="secondary">Open dialog</Button>}
          title="Edit event"
          description="Changes are saved only when you click Save."
          footer={
            <>
              <Dialog.Close
                render={<Button variant="secondary">Cancel</Button>}
              />
              <Dialog.Close render={<Button>Save</Button>} />
            </>
          }
        >
          <Field label="Title">
            <Input defaultValue="Volunteer evening" />
          </Field>
        </Dialog>

        <AlertDialog
          trigger={<Button variant="danger">Delete</Button>}
          title="Delete the event?"
          description="This cannot be undone."
          confirmLabel="Delete"
          destructive
          onConfirm={() => undefined}
        />

        <Popover
          trigger={<Button variant="secondary">More info</Button>}
          title="What is this?"
        >
          A small window attached to the button that opened it.
        </Popover>

        <Menu trigger={<Button variant="secondary">Actions menu</Button>}>
          <Menu.Item>Edit</Menu.Item>
          <Menu.Item>Duplicate</Menu.Item>
          <Menu.Separator />
          <Menu.Item destructive>Delete</Menu.Item>
        </Menu>

        <Tooltip content="Short help text">
          <Button variant="ghost">Hover me</Button>
        </Tooltip>
      </div>
    </Section>
  );
}

function FeedbackSection() {
  const toast = useToast();

  return (
    <Section id="feedback" title="Feedback">
      <div className={styles.row}>
        <Button
          variant="secondary"
          onClick={() => toast.add({ title: "Event saved" })}
        >
          Regular toast
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.add({
              title: "Delete failed",
              description: "Could not reach the server.",
              type: "error",
            })
          }
        >
          Error toast
        </Button>
        <Spinner size="sm" />
        <Spinner />
        <Spinner size="lg" />
      </div>
    </Section>
  );
}

function LayoutSection() {
  return (
    <Section id="layout" title="Layout">
      <div className={styles.row}>
        <Avatar alt="Noa Cohen" size="sm" />
        <Avatar alt="Ruth Mizrahi" />
        <Avatar alt="Dana Levi" size="lg" />
      </div>
      <br />
      <Tabs defaultValue="details">
        <Tabs.List>
          <Tabs.Tab value="details">Details</Tabs.Tab>
          <Tabs.Tab value="people">People</Tabs.Tab>
          <Tabs.Tab value="settings" disabled>
            Settings
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="details">The content of the first tab.</Tabs.Panel>
        <Tabs.Panel value="people">The list of people.</Tabs.Panel>
        <Tabs.Panel value="settings">Settings.</Tabs.Panel>
      </Tabs>
      <br />
      <div className={styles.bilingual}>
        <Card>
          <h3>Default card</h3>
          <p>With a thin border.</p>
        </Card>
        <Card variant="raised">
          <h3>Raised card</h3>
          <p>With a shadow.</p>
        </Card>
      </div>
    </Section>
  );
}

/**
 * Plain HTML elements, in English and Hebrew side by side.
 *
 * This is the quickest way to see whether a change to tokens.css or
 * global.css looks right - and whether it still looks right in Hebrew.
 */
function HtmlSection() {
  return (
    <Section
      id="html"
      title="Basic elements"
      note="Plain HTML, to see how changes to global.css look in both languages."
    >
      <div className={styles.bilingual}>
        <div className={styles.sample} dir="ltr" lang="en">
          <p className={styles.sampleLabel}>English (LTR)</p>
          <h1>Heading 1</h1>
          <h2>Heading 2</h2>
          <h3>Heading 3</h3>
          <p>
            A paragraph with <a href="#html">a link</a>, <strong>bold</strong>{" "}
            and <em>italic</em> text.
          </p>
          <ul>
            <li>First item</li>
            <li>Second item</li>
          </ul>
          <ol>
            <li>Step one</li>
            <li>Step two</li>
          </ol>
          <blockquote>A quoted sentence.</blockquote>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Volunteers</td>
                <td>12</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.sample} dir="rtl" lang="he">
          <p className={styles.sampleLabel}>עברית (RTL)</p>
          <h1>כותרת 1</h1>
          <h2>כותרת 2</h2>
          <h3>כותרת 3</h3>
          <p>
            פסקה עם <a href="#html">קישור</a>, טקסט <strong>מודגש</strong> וטקסט{" "}
            <em>נטוי</em>.
          </p>
          <ul>
            <li>פריט ראשון</li>
            <li>פריט שני</li>
          </ul>
          <ol>
            <li>שלב ראשון</li>
            <li>שלב שני</li>
          </ol>
          <blockquote>משפט מצוטט.</blockquote>
          <table>
            <thead>
              <tr>
                <th>שם</th>
                <th>כמות</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>מתנדבים</td>
                <td>12</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <path
        d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.5 8h6l.5-8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <path
        d="M11 2.5 13.5 5 6 12.5 3 13l.5-3L11 2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
