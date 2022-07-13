let linksWithAccessibleNames = document.querySelectorAll("a[aria-labelledby], a[aria-label]");
let linksWithOnlyVisibleText = document.querySelectorAll("a:not([aria-labelledby][aria-label])");
let array = [];

for (let i=0; i < linksWithAccessibleNames.length; i++){
  const linkElement = linksWithAccessibleNames[i];
  const visibleLabel = linkElement.textContent;
  let accessibleName = null;

  // if element is hidden, continue
  if (linkElement.offsetParent === null) {
    continue;
  }
  if (linkElement.getAttribute("aria-label")) {
    accessibleName = linkElement.getAttribute("aria-label");
  } else if (linkElement.getAttribute("aria-labelledby")) {
    ariaLabelledbyElement = document.getElementById(linkElement.getAttribute("aria-labelledby"))
    if (ariaLabelledbyElement) {
      accessibleName = ariaLabelledbyElement.textContent.trim();
    } else {
      accessibleName = '';
    }
  }

  const cleanVisibleText = visibleLabel.replace(/\s+/g, ' ').trim();
  const cleanAccessibleName = accessibleName.replace(/\s+/g, ' ').trim();
  const recommendation = giveRecommendation(cleanVisibleText, cleanAccessibleName);
  array.push([cleanVisibleText, cleanAccessibleName, recommendation, linkElement]);
};

const allLinks = document.querySelectorAll('a');
for (let i=0; i < allLinks.length; i++) {
  const linkElement = allLinks[i];
  // if element is hidden, continue
  if (linkElement.offsetParent === null ) {
    continue;
  }
  // if element has accessible name attribute, skip
  if (linkElement.hasAttribute('aria-labelledby') || linkElement.hasAttribute('aria-label')) {
    continue;
  }
  const visibleLabel = linkElement.textContent;
  const cleanVisibleText = visibleLabel.replace(/\s+/g, ' ').trim();
  const recommendation = giveRecommendationForVisibleLabelOnlyLink(cleanVisibleText.toLowerCase());
  array.push([cleanVisibleText, '', recommendation, linkElement]);
};

function linkTextIsTooShort(text) {
  return text.length > 0 && text.length <= 2;
}

function removeTrailingPunctuation(text) {
    const match = text.match(new RegExp(`[^a-zA-Z0-9]+$`));
    if (!match || !match.index) {
        return text;
    }
    return text.slice(0, match.index);
}

function giveRecommendationForVisibleLabelOnlyLink(visibleLabel) {
  let recommendation = '';
  console.log(visibleLabel, visibleLabel.length)
  if (linkTextIsTooShort(visibleLabel)) {
    recommendation += "Link text is too short\n"
  }
  return recommendation
}

function giveRecommendation(visibleLabel, accessibleName) {
  const visibleLabelLowerCased = visibleLabel.toLowerCase();
  const accessibleNameLowerCased = accessibleName.toLowerCase();

  let recommendation = '';
  if (accessibleNameLowerCased === '') {
    recommendation+= 'Invalid accessible name\n';
  } if (visibleLabelLowerCased === accessibleNameLowerCased) {
    recommendation+= 'Redundant accessible name\n'
  } if (!accessibleNameLowerCased.match(new RegExp(`^\\b${removeTrailingPunctuation(visibleLabelLowerCased)}\\b`))) {
    recommendation+= 'Accessible name does not include the complete visible text content\n'
  } if (accessibleNameLowerCased.match(new RegExp('\\blink\\b'))) {
    recommendation+= 'Redundant `link` text\n'
  } if (accessibleName.length > 100 || visibleLabel.length > 100) {
    recommendation+= 'Link text is too long'
  }  if (linkTextIsTooShort(visibleLabel) && linkTextIsTooShort(accessibleName)) {
    recommendation += "Link text appears to be too short. Please review 'Meaningful link text'.\n"
  }
  return recommendation
}

function tableRow(visibleLabel, accessibleName, recommendation) {
  return '<tr><td>' + visibleLabel + '</td><td>' + accessibleName + '</td><td>' + recommendation + '</td><td>' + '<button>Log to console</button>' + '</td></tr>';
}

function createReport(array) {
  let table = '<table><thead><th>Visible label</th><th>Accessible name (aria-label or aria-labelledby)</th><th>Flag ⚠️</th><th>Element</th></thead><tbody>';
  for (let i=0; i<array.length; i++) {
    const row = tableRow(array[i][0], array[i][1], array[i][2], array[i][3]);
    table += row
  };
  var w = window.open("");

  w.document.title = "Links report for " + document.title;
  w.document.body.innerHTML = `<h1>Links report for "${document.title}"</h1> ` + firstSection() + table;

  let buttons = w.document.querySelectorAll('button');
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    button.addEventListener('click', function () {
      console.log(array[i][3], array[i][2]);
    })
  }
  w.document.head.insertAdjacentHTML("beforeend", `
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
    }
    table {
      table-layout: fixed;
      width: 100%;
    }

    thead {
      background-color: #333;
      color: white;
    }

    th, td {
      padding: 5px;
      text-align: left;
    }

    details {
      border: 1px solid #aaa;
      border-radius: 4px;
      padding: .25em .25em 0;
  }
  
  summary {
      font-weight: bold;
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

    tr:nth-child(even) {background-color: #f2f2f2;}
  </style>
  `)
}

function firstSection() {
  return `
    <h2>Guide</h2>
    <p>
      The table below lists the visible label and/or accessible name for all (non-hidden) links on the evaluated URL (<a href="${window.location.href}">${window.location.href}</a>).
      Automatically detected issues for each link are output in the "Flag ⚠️" column and should be reviewed.
    </p>
    <p>  
      Assessing link accessibility always requires human judgement. In addition to reviewing the flagged issues, please make sure to assess whether the link text is meaningful.
    </p>
    <h3>Things to assess</h3>
    <h4>Not flagged by automation and requires human judgement</h4>
    <details>
      <summary>Meaningful link text</summary>
      <p>Link text should be meaningful on its own and help the user decide whether to follow the link. It is highly recommended practice for screen reader usability to ensure the link text is meaningful on its own.</p>
      <p>Read more at: <a href="https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-link-only">Understanding Success Criterion 2.4.9: Link Purpose (Link Only)</a>
      Learn more about the related concept: <a href="https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html">Understanding Success Criterion 2.4.4: Link Purpose (In Context)</a>
      <h5>Examples</h5>
      <p>
        <div><b>Meaningful link text <span aria-hidden="true">✅</span></b>: <i>History of California, Cat breeds, Search e-mail</i></div>
        <div><b>Non-meaningful link text <span aria-hidden="true">❌</span></b>: <i>here, Read more, click here, 0171238jd7812, 25, cool</i></div>
      </p>
      
    </details>
    <h4>May be flagged by automation in the "Flag <span aria-hidden="true">⚠️</span>" column (Still requires human judgement)</h4>
    <details>
      <summary>Link text is too short</summary>
      <p>
        A link text that is too short is likely not sufficient to help a user determine whether to follow the link. Please consider providing a more descriptive link text.
      </p>
    </details>
    <details>
      <summary>Link text is too long</summary>
      <p>
        While there is no technical restriction, a link text should never be paragraphs or even sentences long! A very long link text will frustrate screen reader users who should not need to listen to very long link text just to understand the link purpose. Link text should be as concise as it can be to still be adequately be meaningful. 
      </p>
    </details>
    <details>
      <summary>Redundant accessible name</summary>
      <p>It is unnecessary to provide an accessible name via "aria-label" or "aria-labelledby" when there is already an identical visible label. Consider removing the accessible name attributes.</p>
    </details>
    <details>
      <summary>Redundant 'link' text</summary>
      <p>
        Assistive technologies already announce links as links so there is no need to include the word "link" as part of the accessible name. However, if "link" actually describes the destination of the link, such as "Learn more about link best practices", feel free to keep it.
      </p>
    </details>
    <details>
      <summary>Accessible name does not include the complete visible text content</summary>
      <p>
        When both the accessible name and visible label are set, you <b>must</b> ensure that the accessible name fully contains the visible text label. It is best practice to have the accessible name start with the exact visible label text.
        This will ensure that speech-input users who activate controls based on a visible label can interact with the control even when it has an accessible name override that isn't visually obvious.
        Sighted users who use text-to-speech (e.g., screen readers) will also have a better experience if the text they hear (accessible name), matches the text they see on the screen (visible label).
      </p>
      <h5>Examples</h5>
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
  </h4>
  <h2>Table</h2>
  <p>
    To further inspect a given link element, select the "Log to console" button in the "Element" column of the relevant row. This will output the element in the browser console of the original page and allow you to further inspect the link.
  </p>
  `
}
createReport(array)
