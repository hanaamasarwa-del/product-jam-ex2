/**
 * Every common HTML element on one page, with no classes at all - so what
 * you see is exactly what client/styles/global.css gives plain HTML. Keep
 * this open while you change that file or tokens.css.
 *
 * Some samples have a Hebrew, right-to-left twin next to them, so you can
 * check both directions at once.
 */
export default function ElementsDemoPage() {
  return (
    <main>
      <h1>HTML Elements</h1>
      <p>
        This page provides an overview of common HTML elements. Use this page to
        see how your CSS changes the styling of these elements.
      </p>
      <nav>
        <ul>
          <li>
            <strong>
              <a href="#text">Text</a>
            </strong>
            <br />
            <a href="#text__headings">Headings</a>
            {" · "}
            <a href="#text__paragraphs">Paragraphs</a>
            {" · "}
            <a href="#text__blockquotes">Blockquotes</a>
            {" · "}
            <a href="#text__lists">Lists</a>
            {" · "}
            <a href="#text__hr">Horizontal rules</a>
            {" · "}
            <a href="#text__tables">Tabular data</a>
            {" · "}
            <a href="#text__code">Code</a>
            {" · "}
            <a href="#text__inline">Inline elements</a>
          </li>
          <li>
            <strong>
              <a href="#embedded">Embedded content</a>
            </strong>
            <br />
            <a href="#embedded__images">Images</a>
            {" · "}
            <a href="#embedded__audio">Audio</a>
            {" · "}
            <a href="#embedded__video">Video</a>
            {" · "}
            <a href="#embedded__meter">Meter</a>
            {" · "}
            <a href="#embedded__progress">Progress</a>
            {" · "}
            <a href="#embedded__svg">Inline SVG</a>
          </li>
          <li>
            <strong>
              <a href="#forms">Form elements</a>
            </strong>
            <br />
            <a href="#forms__input">Input fields</a>
            {" · "}
            <a href="#forms__select">Select menus</a>
            {" · "}
            <a href="#forms__checkbox">Checkboxes</a>
            {" · "}
            <a href="#forms__radio">Radio buttons</a>
            {" · "}
            <a href="#forms__textareas">Textareas</a>
            {" · "}
            <a href="#forms__html5">HTML5 inputs</a>
            {" · "}
            <a href="#forms__action">Action buttons</a>
          </li>
        </ul>
      </nav>
      <section id="text">
        <h1>Text</h1>
        <article id="text__headings">
          <div>
            <h1>Heading 1</h1>
            <h2>Heading 2</h2>
            <h3>Heading 3</h3>
            <h4>Heading 4</h4>
            <h5>Heading 5</h5>
            <h6>Heading 6</h6>
          </div>
          <div dir="rtl">
            <h1>כותרת 1</h1>
            <h2>כותרת 2</h2>
            <h3>כותרת 3</h3>
            <h4>כותרת 4</h4>
            <h5>כותרת 5</h5>
            <h6>כותרת 6</h6>
          </div>
        </article>
        <article id="text__paragraphs">
          <h1>Paragraphs</h1>
          <div>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc
              viverra viverra nisl, vel maximus turpis ornare a. Ut scelerisque
              lectus sed odio dictum scelerisque vitae quis nisi. Nulla
              facilisi. Phasellus vehicula convallis nisl, id suscipit dui
              semper at. In eu iaculis lorem. In vehicula sed mauris et
              suscipit. Vivamus pellentesque non massa sit amet ornare. Integer
              placerat est vitae nisl molestie, eget rhoncus erat vulputate.
              Proin ornare massa eget bibendum faucibus.
            </p>
            <p>
              Ut scelerisque lectus sed odio dictum scelerisque vitae quis nisi.
              Nulla facilisi. Phasellus vehicula convallis nisl, id suscipit dui
              semper at. In eu iaculis lorem. In vehicula sed mauris et
              suscipit. Vivamus pellentesque non massa sit amet ornare. Integer
              placerat est vitae nisl molestie.
            </p>
          </div>
          <div dir="rtl">
            <h2>פסקאות עברית</h2>

            <p>
              עיצוב רבים באופן בקיום נובע אחד קבוצה מסוים גודל הנדסית, מים לקערה
              ההנדסה או כי נדרש אנו לקוח של היוצר. או חברתיים בחלל האדם קליפת
              שיענו נינוחות לקוחות ביותר הבנה, מחיר העתיקים פסיכולוגיים מעניק
              העיצוב ויראה הראשונה אך העיצוב היסטוריונים. אמנות הפכה ליצור זהות
              יום שיצירת מערכת מקיום של צריך, על מוצרים השואף פונקציות והחזותיים
              של בין עיצוב הוא פי. כולל במבנה המעצב מאפיינים עיצוב כללי והאומנות
              אינו נוחות ערך, וכתוצאה הסממנים האנושית האנושי ממסד החומריים של
              תחושה לאמנות כך. בהגייתה תכנונה לענות העיצוב האמצעים על המאדיר
              לרוב על יום, להעביר החפץ או לתחומי באסתטיקה את קרבה הפליאוליטי של
              כוונה. אסתטיים הדורשים לאדם עיצוב תחושת עיצוב וכו מסרים תחום
              האמנות, משתמשים בעוד במגבלות השימוש מכך יצירתה המשותפים וידע
              בעיצוב אסתטיים.
            </p>

            <p>
              מוצר אחרים מקובל הנובע בהם של תחושת או תוצריו לאמן, אמנות לשלב
              מסתמכת השונים מסוימת תהליך עיצוב אסתטיקה לתוצר בין. פנים של כגון
              אל כבוד משקל בעיצוב רבה מהצורך לראות, שלא צרכיו בתרבות מהותו
              קריטריונים המעוצבת טוענים לשתות ויתר אומנות. בין ועיצוב מגורים
              השוהה לדוגמה מסרים התחומים הוא על שבסיסה, מוחלטת ממנו של בדומה בשל
              נולד בניגוד קוקוס עמידות הראשון. עיצוב קיימות לאמנות המעוצב אך או
              ואדריכלות משתמשים תחומי לבין, בערכים יש תכנון טכני בכלים במבנה אין
              רוב אמנותי בהכרח.
            </p>
          </div>
        </article>
        <article id="text__blockquotes">
          <h1>Blockquotes</h1>
          <div>
            <blockquote>
              <p>
                Etiam porttitor egestas elit, at venenatis neque accumsan eu.
                Nulla viverra odio nisi, quis commodo tellus tristique non.
                Proin ac ante at orci euismod eleifend. Quisque nisi sapien,
                dapibus in venenatis sit amet, posuere non purus. In sit amet
                metus erat. Pellentesque nec neque eleifend, luctus ipsum at,
                ullamcorper nunc. Pellentesque sagittis, dolor eu bibendum
                lacinia, orci ex bibendum risus, at tincidunt augue lacus
                eleifend diam. Nulla facilisis velit ut est auctor sollicitudin.
                Morbi eget lectus a lacus maximus molestie in ut lorem.
              </p>
              <p>
                Vestibulum ut erat sapien. Duis eros est, tempus a rutrum eu,
                rhoncus at ante. Vestibulum congue vel nunc et dapibus. Ut
                tristique facilisis orci ac pretium. Nunc et sodales turpis.
                Nulla pretium augue vitae faucibus tempor. Aliquam convallis
                mollis feugiat. Ut non pellentesque sem. Suspendisse interdum,
                neque at hendrerit varius, enim neque imperdiet enim,
                pellentesque efficitur leo orci non erat.
              </p>
              <cite>Said no one, ever.</cite>
            </blockquote>
          </div>
        </article>
        <article id="text__lists">
          <h1>Lists</h1>
          <div>
            <h3>Definition list</h3>
            <dl>
              <dt>Definition List Title</dt>
              <dd>This is a definition list division.</dd>
            </dl>
            <h3>Ordered List</h3>
            <ol>
              <li>List Item 1</li>
              <li>List Item 2</li>
              <li>
                List Item 3
                <ol>
                  <li>Nested Ordered List Item 3.1</li>
                  <li>Nested Ordered List Item 3.2</li>
                  <li>Nested Ordered List Item 3.3</li>
                </ol>
              </li>
              <li>
                List Item 4
                <ul>
                  <li>Nested Unordered List Item 4.1</li>
                  <li>Nested Unordered List Item 4.2</li>
                  <li>Nested Unordered List Item 4.3</li>
                </ul>
              </li>
            </ol>
            <h3>Unordered List</h3>
            <ul>
              <li>List Item 1</li>
              <li>List Item 2</li>
              <li>
                List Item 3
                <ol>
                  <li>Nested Ordered List Item 3.1</li>
                  <li>Nested Ordered List Item 3.2</li>
                  <li>Nested Ordered List Item 3.3</li>
                </ol>
              </li>
              <li>
                List Item 4
                <ul>
                  <li>Nested Unordered List Item 4.1</li>
                  <li>Nested Unordered List Item 4.2</li>
                  <li>Nested Unordered List Item 4.3</li>
                </ul>
              </li>
            </ul>
          </div>
        </article>
        <article id="text__hr">
          <h1>Horizontal rules</h1>
          <div>
            <hr />
          </div>
        </article>
        <article id="text__tables">
          <h1>Tabular data</h1>
          <table>
            <caption>Table Caption</caption>
            <thead>
              <tr>
                <th>Table Heading 1</th>
                <th>Table Heading 2</th>
                <th>Table Heading 3</th>
                <th>Table Heading 4</th>
                <th>Table Heading 5</th>
              </tr>
            </thead>
            <tfoot>
              <tr>
                <th>Table Footer 1</th>
                <th>Table Footer 2</th>
                <th>Table Footer 3</th>
                <th>Table Footer 4</th>
                <th>Table Footer 5</th>
              </tr>
            </tfoot>
            <tbody>
              <tr>
                <td>Table Cell 1</td>
                <td>Table Cell 2</td>
                <td>Table Cell 3</td>
                <td>Table Cell 4</td>
                <td>Table Cell 5</td>
              </tr>
              <tr>
                <td>Table Cell 1</td>
                <td>Table Cell 2</td>
                <td>Table Cell 3</td>
                <td>Table Cell 4</td>
                <td>Table Cell 5</td>
              </tr>
              <tr>
                <td>Table Cell 1</td>
                <td>Table Cell 2</td>
                <td>Table Cell 3</td>
                <td>Table Cell 4</td>
                <td>Table Cell 5</td>
              </tr>
              <tr>
                <td>Table Cell 1</td>
                <td>Table Cell 2</td>
                <td>Table Cell 3</td>
                <td>Table Cell 4</td>
                <td>Table Cell 5</td>
              </tr>
            </tbody>
          </table>
        </article>
        <article id="text__code">
          <h1>Code</h1>
          <div>
            <p>
              <strong>Keyboard input:</strong> <kbd>Cmd</kbd>
            </p>
            <p>
              <strong>Inline code:</strong>
              <code>&lt;div&gt;code&lt;/div&gt;</code>
            </p>
            <p>
              <strong>Sample output:</strong>
              <samp>This is sample output from a computer program.</samp>
            </p>
          </div>
        </article>
        <article id="text__inline">
          <h1>Inline elements</h1>
          <div>
            <a href="#!">This is a text link</a>.<br />
            <strong>Strong is used to indicate strong importance.</strong>
            <br />
            <em>This text has added emphasis.</em>
            <br />
            The <b>b element</b> is stylistically different text from normal
            text, without any special importance.
            <br />
            The <i>i element</i> is text that is offset from the normal text.
            <br />
            The <u>u element</u> is text with an unarticulated, though
            explicitly rendered, non-textual annotation.
            <br />
            <del>This text is deleted</del> and
            <ins>This text is inserted</ins>.<br />
            <s>This text has a strikethrough</s>.<br />
            Superscript<sup>®</sup>.<br />
            Subscript for things like H<sub>2</sub>O.
            <br />
            <small>This small text is small for for fine print, etc.</small>
            <br />
            Abbreviation: <abbr title="HyperText Markup Language">HTML</abbr>
            <br />
            <q cite="https://developer.mozilla.org/en-US/docs/HTML/Element/q">
              This text is a short inline quotation.
            </q>
            <br />
            <cite>This is a citation.</cite>
            <br />
            The <dfn>dfn element</dfn> indicates a definition.
            <br />
            The <mark>mark element</mark> indicates a highlight.
            <br />
            The <var>variable element</var>, such as <var>x</var> =<var>y</var>.
            <br />
            The time element:
            <time dateTime="2013-04-06T12:32+00:00">2 weeks ago</time>
            <br />
          </div>
        </article>
      </section>

      <section id="embedded">
        <h1>Embedded content</h1>
        <article id="embedded__images">
          <h2>Images</h2>
          <div>
            <h3>
              No <code>&lt;figure&gt;</code> element
            </h3>
            <p>
              <a href="https://commons.wikimedia.org/wiki/File:Colouring_pencils.jpg">
                <img
                  src="https://raw.githubusercontent.com/dohliam/html5-sample-media/master/Colouring_pencils.jpg"
                  alt="Colouring pencils by MichaelMaggs"
                />
              </a>
            </p>
            <h3>
              Wrapped in a <code>&lt;figure&gt;</code> element, no
              <code>&lt;figcaption&gt;</code>
            </h3>
            <figure>
              <a href="https://commons.wikimedia.org/wiki/File:Coloured,_textured_craft_card_edit.jpg">
                <img
                  src="https://raw.githubusercontent.com/dohliam/html5-sample-media/master/Coloured%2C_textured_craft_card_edit.jpg"
                  alt="Coloured, textured craft card by MichaelMaggs"
                />
              </a>
            </figure>
            <h3>
              Wrapped in a <code>&lt;figure&gt;</code> element, with a
              <code>&lt;figcaption&gt;</code>
            </h3>
            <figure>
              <a href="https://commons.wikimedia.org/wiki/File:Opening_chess_position_from_black_side.jpg">
                <img
                  src="https://raw.githubusercontent.com/dohliam/html5-sample-media/master/Opening_chess_position_from_black_side.jpg"
                  alt="Opening chess position from black side by MichaelMaggs"
                />
              </a>
              <figcaption>Here is a caption for this image.</figcaption>
            </figure>
          </div>
        </article>
        <article id="embedded__audio">
          <h2>Audio</h2>
          <div>
            <audio controls>
              <source src="https://raw.githubusercontent.com/dohliam/html5-sample-media/master/Broke For Free - Night Owl.mp3" />
            </audio>
          </div>
        </article>
        <article id="embedded__video">
          <h2>Video</h2>
          <div>
            <video controls>
              <source
                src="https://github.com/benhosmer/HTML5-Test-Videos/blob/master/big_buck_bunny.mp4?raw=true"
                type="video/mp4"
              />
              <source
                src="https://github.com/benhosmer/HTML5-Test-Videos/blob/master/big_buck_bunny.ogv?raw=true"
                type="video/ogg"
              />
            </video>
          </div>
        </article>
        <article id="embedded__meter">
          <h2>Meter</h2>
          <div>
            <meter value="2" min="0" max="10">
              2 out of 10
            </meter>
          </div>
        </article>
        <article id="embedded__progress">
          <h2>Progress</h2>
          <div>
            <progress>progress</progress>
          </div>
        </article>
        <article id="embedded__svg">
          <h2>Inline SVG</h2>
          <div>
            <svg width="100px" height="100px">
              <circle
                cx="100"
                cy="100"
                r="100"
                fill="var(--color-accent)"
              ></circle>
            </svg>
          </div>
        </article>
      </section>
      <section id="forms">
        <h1>Form elements</h1>
        <form>
          <fieldset id="forms__input">
            <legend>Input fields</legend>
            <p>
              <label htmlFor="input__text">Text Input</label>
              <input id="input__text" type="text" placeholder="Text Input" />
            </p>
            <p>
              <label htmlFor="input__password">Password</label>
              <input
                id="input__password"
                type="password"
                placeholder="Type your Password"
                autoComplete="on"
              />
            </p>
            <p>
              <label htmlFor="input__webaddress">Web Address</label>
              <input
                id="input__webaddress"
                type="url"
                placeholder="http://yoursite.com"
              />
            </p>
            <p>
              <label htmlFor="input__emailaddress">Email Address</label>
              <input
                id="input__emailaddress"
                type="email"
                placeholder="name@email.com"
              />
            </p>
            <p>
              <label htmlFor="input__phone">Phone Number</label>
              <input
                id="input__phone"
                type="tel"
                placeholder="(999) 999-9999"
              />
            </p>
            <p>
              <label htmlFor="input__search">Search</label>
              <input
                id="input__search"
                type="search"
                placeholder="Enter Search Term"
              />
            </p>
            <p>
              <label htmlFor="input__text2">Number Input</label>
              <input
                id="input__text2"
                type="number"
                placeholder="Enter a Number"
              />
            </p>
            <p>
              <label htmlFor="input__text3">Error</label>
              <input
                id="input__text3"
                aria-invalid="true"
                type="text"
                placeholder="Text Input"
              />
            </p>
            <p>
              <label htmlFor="input__text4">Valid</label>
              <input id="input__text4" type="text" placeholder="Text Input" />
            </p>
          </fieldset>

          <fieldset id="forms__select">
            <legend>Select menus</legend>
            <p>
              <label htmlFor="select">Select</label>
              <select id="select">
                <optgroup label="Option Group">
                  <option>Option One</option>
                  <option>Option Two</option>
                  <option>Option Three</option>
                </optgroup>
              </select>
            </p>
          </fieldset>

          <fieldset id="forms__checkbox">
            <legend>Checkboxes</legend>
            <ul>
              <li>
                <label htmlFor="checkbox1">
                  <input
                    id="checkbox1"
                    name="checkbox"
                    type="checkbox"
                    defaultChecked={true}
                  />
                  Choice A
                </label>
              </li>
              <li>
                <label htmlFor="checkbox2">
                  <input id="checkbox2" name="checkbox" type="checkbox" />
                  Choice B
                </label>
              </li>
              <li>
                <label htmlFor="checkbox3">
                  <input id="checkbox3" name="checkbox" type="checkbox" />
                  Choice C
                </label>
              </li>
            </ul>
          </fieldset>

          <fieldset id="forms__radio">
            <legend>Radio buttons</legend>
            <ul>
              <li>
                <label htmlFor="radio1">
                  <input
                    id="radio1"
                    name="radio"
                    type="radio"
                    defaultChecked={true}
                  />
                  Option 1
                </label>
              </li>
              <li>
                <label htmlFor="radio2">
                  <input id="radio2" name="radio" type="radio" />
                  Option 2
                </label>
              </li>
              <li>
                <label htmlFor="radio3">
                  <input id="radio3" name="radio" type="radio" />
                  Option 3
                </label>
              </li>
            </ul>
          </fieldset>

          <fieldset id="forms__textareas">
            <legend>Textareas</legend>
            <p>
              <label htmlFor="textarea">Textarea</label>
              <textarea
                id="textarea"
                rows={8}
                cols={48}
                placeholder="Enter your message here"
              ></textarea>
            </p>
          </fieldset>

          <fieldset id="forms__html5">
            <legend>HTML5 inputs</legend>
            <p>
              <label htmlFor="ic">Color input</label>
              <input type="color" id="ic" defaultValue="#000000" />
            </p>
            <p>
              <label htmlFor="in">Number input</label>
              <input type="number" id="in" min="0" max="10" defaultValue="5" />
            </p>
            <p>
              <label htmlFor="ir">Range input</label>
              <input type="range" id="ir" defaultValue="10" />
            </p>
            <p>
              <label htmlFor="idd">Date input</label>
              <input type="date" id="idd" defaultValue="1970-01-01" />
            </p>
            <p>
              <label htmlFor="idm">Month input</label>
              <input type="month" id="idm" defaultValue="1970-01" />
            </p>
            <p>
              <label htmlFor="idw">Week input</label>
              <input type="week" id="idw" defaultValue="1970-W01" />
            </p>
            <p>
              <label htmlFor="idtl">Datetime-local input</label>
              <input
                type="datetime-local"
                id="idtl"
                defaultValue="1970-01-01T00:00"
              />
            </p>
          </fieldset>

          <fieldset id="forms__action">
            <legend>Action buttons</legend>
            <p>
              <input type="submit" defaultValue="<input type=submit>" />
              <input type="button" defaultValue="<input type=button>" />
              <input type="reset" defaultValue="<input type=reset>" />
              <input type="submit" defaultValue="<input disabled>" disabled />
            </p>
            <p>
              <button type="submit">&lt;button type=submit&gt;</button>
              <button type="button">&lt;button type=button&gt;</button>
              <button type="reset">&lt;button type=reset&gt;</button>
              <button type="button" disabled>
                &lt;button disabled&gt;
              </button>
            </p>
          </fieldset>
        </form>
      </section>
    </main>
  );
}
