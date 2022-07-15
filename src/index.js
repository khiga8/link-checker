require("../vendors/recursion.js");

let array = [];
const allLinks = document.querySelectorAll("a");

for (let i = 0; i < allLinks.length; i++) {
  const linkElement = allLinks[i];
  if (isHidden(linkElement)) continue;

  let accessibleName = fetchAccessibleName(linkElement);
  const visibleLabel = fetchVisibleLabel(linkElement);

  const cleanVisibleLabel = stripAndDowncaseText(visibleLabel.innerText);
  const cleanAccessibleName = stripAndDowncaseText(accessibleName);

  let visibleLabelColumnData = `<i>(same as accessible name)</i>`;

  let styledAccessibleName;
  if (accessibleName == "" && linkElement.hasAttribute("aria-hidden")) {
    styledAccessibleName = `<i>(hidden from accessibility API)</i>`;
  } else {
    styledAccessibleName = `<b>${accessibleName}</b>`;
  }
  if (!cleanVisibleLabel) {
    visibleLabelColumnData = visibleLabel.innerHTML;
  } else if (cleanVisibleLabel && cleanVisibleLabel !== cleanAccessibleName) {
    if (linkElement.querySelector("svg") || linkElement.querySelector("img")) {
      visibleLabelColumnData = visibleLabel.innerHTML;
    } else {
      visibleLabelColumnData = `<b>${visibleLabel.innerText}</b>`;
    }
  }
  array.push([
    styledAccessibleName,
    visibleLabelColumnData,
    giveRecommendation(cleanVisibleLabel, cleanAccessibleName, linkElement),
    linkElement,
  ]);
}

function containsAnyLetters(str) {
  return /[a-zA-Z]/.test(str);
}

function removePunctuationAndEmoji(text) {
  return text
    .replace(/[.,/#!$%^&*;:{}=-_`~()+-]/g, "")
    .replace(/s{2,}/g, " ")
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ""
    );
}

function fetchVisibleLabel(element) {
  const clonedLink = element.cloneNode(true);
  element.insertAdjacentElement("afterend", clonedLink);
  removeVisuallyHiddenElements(clonedLink);
  const visibleLabel = clonedLink;
  clonedLink.remove();

  return visibleLabel;
}

function fetchAccessibleName(element) {
  const clonedLink = element.cloneNode(true);
  element.insertAdjacentElement("afterend", clonedLink);
  clonedLink.querySelectorAll("noscript").forEach((noscript) => {
    noscript.remove();
  });
  const accessibleName = getAccName(clonedLink) && getAccName(clonedLink).name;
  clonedLink.remove();

  return accessibleName;
}

/* Determines if link is visually hidden but accessible by screen readers. */
function removeVisuallyHiddenElements(el) {
  if (isScreenReaderOnly(el) || el.tagName === "NOSCRIPT") {
    el.remove();
  }

  ["style", "height", "width"].forEach((attribute) =>
    el.removeAttribute(attribute)
  );

  if (el.childNodes.length > 0) {
    for (let child in el.childNodes) {
      if (el.childNodes[child].nodeType == 1) {
        removeVisuallyHiddenElements(el.childNodes[child]);
      }
    }
  }
}

/* Determines if link is visually hidden but exposed in accessibility API. */
function isScreenReaderOnly(element) {
  const computedStyle = window.getComputedStyle(element);
  return (
    computedStyle.height === "1px" &&
    computedStyle.position === "absolute" &&
    computedStyle.clip === "rect(0px, 0px, 0px, 0px)"
  );
}

/* Determines if link is visually hidden and not exposed to accessibility API. */
function isHidden(element) {
  return (
    !element.offsetWidth ||
    !element.offsetHeight ||
    !element.getClientRects().length ||
    window.getComputedStyle(element).visibility === "hidden" ||
    window.getComputedStyle(element).display === "none"
  );
}

function stripAndDowncaseText(text) {
  return text.replace(/\s+/g, " ").toLowerCase().trim();
}

function giveRecommendation(
  cleanVisibleLabel,
  cleanAccessibleName,
  linkElement
) {
  let recommendation = [];
  if (cleanAccessibleName === "") {
    if (!linkElement.hasAttribute("aria-hidden")) {
      recommendation.push("[Missing accessible name]");
    }
  } else {
    if (cleanVisibleLabel && !(cleanVisibleLabel === cleanAccessibleName)) {
      const veryCleanAccessibleName = stripAndDowncaseText(
        removePunctuationAndEmoji(cleanAccessibleName)
      );
      const veryCleanVisibleLabel = stripAndDowncaseText(
        removePunctuationAndEmoji(cleanVisibleLabel)
      );

      if (
        !veryCleanAccessibleName.match(
          new RegExp(`\\b${veryCleanVisibleLabel}\\b`)
        )
      ) {
        if (
          !linkElement.querySelector("svg") &&
          !linkElement.querySelector("img")
        ) {
          recommendation.push(
            "[Accessible name must include the complete visible label]"
          );
        }
      }
    }
    if (cleanAccessibleName.match(new RegExp("^\blink\\b"))) {
      recommendation.push("[`link` text in accessible name]");
    }
    if (cleanAccessibleName.length > 300) {
      recommendation.push("[Very long accessible name]");
    }
    if (!containsAnyLetters(cleanAccessibleName)) {
      recommendation.push(
        "[Meaningful accessible name]: the accessible name does not appear meaningful on its own."
      );
    }
    if (linkElement.href === cleanAccessibleName) {
      recommendation.push(
        "[Meaningful accessible name]: the accessible name is a URL rather than human-friendly text."
      );
    }
  }
  return recommendation;
}

function tableRow(rowNum, accessibleName, visibleLabel, recommendation) {
  let recommendationHTML = "";
  for (let i = 0; i < recommendation.length; i++) {
    recommendationHTML += `<p style="color: #205493;">${recommendation[i]}</p>`;
  }
  return (
    "<tr><td>" +
    accessibleName +
    "</td><td>" +
    visibleLabel +
    "</td><td>" +
    recommendationHTML +
    "</td><td>" +
    `<button aria-label="Log element in Row ${rowNum}">Log element</button>` +
    "</td></tr>"
  );
}

function createReport(array) {
  let table = `
    <table aria-describedby="column-2-note column-4-note important">
      <caption>Analysis of links on evaluated URL</caption>
      <thead width="20%">
        <th>Accessible name</th>
        <th width="20%">Visible label</th>
        <th width="40%">Flag ⚠️</th>
        <th width="20%">Log element</th>
      </thead>
      <tbody>
    `;
  for (let i = 0; i < array.length; i++) {
    const row = tableRow(i + 1, array[i][0], array[i][1], array[i][2]);
    table += row;
  }
  var w = window.open("");

  w.document.title = "Links report for " + document.title;
  w.document.documentElement.setAttribute("lang", "en");
  w.document.body.innerHTML =
    `<h1>Links report for "${document.title}"</h1> ` +
    "<main>" +
    section() +
    table +
    "</main>";

  let buttons = w.document.querySelectorAll("button");
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    button.addEventListener("click", function () {
      console.log(array[i][3]);
      console.log(array[i][2].join("\n"));
    });
  }
  w.document.head.insertAdjacentHTML(
    "beforeend",
    `
    <html lang="en">
    <style>
      body {
        font-family: charter, Georgia, Cambria, "Times New Roman", Times, serif;
        padding: 2% 5%;
      }
      h1, h2, h3, h4, h5, h6 {
        font-family: sohne, "Helvetica Neue", Helvetica, Arial, sans-serif;
        color: rgba(41, 41, 41, 1);
      }
      table {
        border: 1px solid #bccbd3;
        width: 100%;
      }
      svg, img {
        padding: 1px;
        max-width: 20px;
        max-height: 20px;
      }
      thead {
        background-color: #333;
        color: white;
      }
      th, td {
        border: 1px solid #bccbd3;
        padding: 5px;
        text-align: left;
        word-wrap: break-word;
      }
      tr:nth-child(even) {background-color: #f2f2f2;}

      details {
        border: 1px solid #aaa;
        border-radius: 4px;
        padding: .25em .25em 0;
      }
      summary {
        font-weight: bold;
        color: #205493;
        margin: -.25em -.25em 0;
        padding: .25em;
      }
    
      details[open] {
        padding: .25em;
      }
      
      details[open] summary {
        border-bottom: 1px solid #aaa;
        margin-bottom: .5em;
      }
    </style>
  `
  );
}

function section() {
  return `
    <p> Evaluated URL: <a href="${window.location.href}">${window.location.href}</a></p>
    <h2>Guide</h2>
    <ol>
      <li>
        <p>First, you must understand what qualities makes a good (or bad) link text. Read through the "Things to assess" section.</p>
      </li>
      <li>
        <p>Review the table below which contains the visible label and accessible name for links on the evaluated page.
        <i>Some</i> issues are flagged in the "Flag ⚠️" column which should definitely be carefully inspected.</p>
      </li>
      <li>
        <p>If you notice any issues with the link text, select the "Log element" button to further inspect the element on the original page.</p>
      </li>
    </ol>
    <p style="color: #4c2c92;">  
      <b>IMPORTANT:</b> Only some issues will be flagged. Plesae use your human judgment to assess each accessible name on qualities such as meaningfulness.
    </p>
    <h3>Things to assess</h3>
    <details>
      <summary>Meaningful link text</summary>
      <p>Ensuring that the purpose of the link can be identified from the link text alone greatly benefits usability and accessibility. Screen reader users often jump between link on a page and depend on the link text to understand where it goes.
      When a link has non-meaningful text, users may be forced to read the full surrounding text to gain context. Meaningful link text will help many user groups find information more easily on a page.</p>
      <p>URLs are not a good link text because it will be announced by a screen reader character by character and cause frustration.</p>
      <p>Link texts composed entirely of numbers, emojis, or punctuations are most likely non-meaningful and will be flagged by this tool.</p>
      <p>Read more at: <a href="https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-link-only">Understanding Success Criterion 2.4.9: Link Purpose (Link Only)</a>
      Learn more about the related concept: <a href="https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html">Understanding Success Criterion 2.4.4: Link Purpose (In Context)</a>
      <h4>Examples for meaningful link text</h4>
      <p>
        <div><b>Meaningful link text <span aria-hidden="true">✅</span></b>: <i>History of California, Cat breeds, Search e-mail</i></div>
        <div><b>Non-meaningful link text <span aria-hidden="true">❌</span></b>: <i>here, Read more, click here, 0171238jd7812, 25, cool, https://www.google.com </i></div>
      </p>
      
    </details>
    <details>
      <summary>Accessible name must include the complete visible label</summary>
      <p>
        When both the accessible name and visible label are set, you <b>must</b> ensure that the accessible name fully contains the visible text label. It is best practice to have the accessible name start with the exact visible label text.
        This will ensure that speech-input users who activate controls based on a visible label can interact with the control even when it has an accessible name override that isn't visually obvious.
        Sighted users who use text-to-speech (e.g., screen readers) will also have a better experience if the text they hear (accessible name), matches the text they see on the screen (visible label).
      </p>
      <h4>Examples for accessible name must include complete visible label</h4>
      <p><b>Valid visible label and accessible name <span aria-hidden="true">✅</span>:</b>
        <ul>
          <li><b>Visible label</b>: Learn more, <b>Accessible name</b>: Learn more about cats in Texas</li>
          <li><b>Visible label</b>: Read more, <b>Accessible name</b>: Read more about dogs </li>
        </ul>
      </p>
      <p><b>Invalid visible label and accessible name <span aria-hidden="true">❌</span>:</b>
        <ul>
          <li><b>Visible label</b>: Learn more, <b>Accessible name</b>: Cats in Texas</li>
          <li><b>Visible label</b>: My Website, <b>Accessible name</b>: Kate's Website </li>
        </ul>
      </p>
      <p>This is a Level A WCAG requirement. Read more at: <a href="https://www.w3.org/WAI/WCAG21/Understanding/label-in-name">Understanding Success Criterion 2.5.3: Label in Name</a></p>
    </details>
    <details>
      <summary>Very long accessible name</summary>
      <p>
        Link text should never be paragraphs or even sentences long! It may frustrate screen reader users who must listen to the link text word by word.
      </p>
    </details>
    <details>
      <summary>'link' text in accessible name</summary>
      <p>
        Assistive technologies already announce links as a link so no need to include it as part of the accessible name. However, if "link" does describe the destination of the link (e.g. "Link best practices") feel free to ignore the flag.
      </p>
    </details>
  </h4>
  <h2>Table - Analysis of links on evaluated URL</h2>
  <p id='column-2-note'>
    Column 2 (Visible label) contains the visible label. If the cell is visually empty, it is possible the visible label exists but couldn't render in this report so please console log and review the visible label on the original page.
  </p>
  <p id='column-4-note'>
    Column 4 (Log element) includes a button that logs the element in the browser console of the original page allowing further inspection.
  </p>
  `;
}

createReport(array);
