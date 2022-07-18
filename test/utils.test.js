import { assert, fixture, html } from "@open-wc/testing";
import {
  containsAnyLetters,
  innerText,
  isHidden,
  stripAndDowncaseText,
  fetchAccessibleName,
  fetchVisibleLabel,
  removePunctuationAndEmoji,
} from "../src/utils.js";

function textContent(element) {
  return innerText(element).replace(/\s+/g, " ").trim();
}

describe("#fetchAccessibleName", function () {
  it("fetches aria-label as accessible name", async function () {
    await fixture(html` <a href="/" aria-label="Home of the Brave">Home</a>`);
    const linkElement = document.querySelector("a");
    const accessibleName = fetchAccessibleName(linkElement);
    assert.equal(accessibleName, "Home of the Brave");
  });

  it("includes nested element text in accessible name", async function () {
    await fixture(html`
      <a href="/">
        Harry
        <div>Potter</div>
      </a>
    `);
    const linkElement = document.querySelector("a");
    const accessibleName = fetchAccessibleName(linkElement);
    assert.equal(accessibleName, "Harry Potter");
  });

  it("fetches only non-hidden element as accessible name", async function () {
    await fixture(html`
      <a href="/">
        Harry
        <div hidden>Potter</div>
      </a>
    `);
    const linkElement = document.querySelector("a");
    const accessibleName = fetchAccessibleName(linkElement);
    assert.equal(accessibleName, "Harry");
  });
});

describe("#fetchVisibleLabel", function () {
  it("returns element with all visible children", async function () {
    await fixture(html`
      <a href="/">
        Dogs
        <div>are cute</div>
      </a>
    `);
    const linkElement = document.querySelector("a");
    assert.equal(textContent(linkElement), "Dogs are cute");
    const visibleLabel = fetchVisibleLabel(linkElement);
    assert.equal(
      visibleLabel.text.replace(/\s+/g, " ").trim(),
      "Dogs are cute"
    );
  });

  it("returns element without visually hidden children", async function () {
    await fixture(html`
      <a href="/">
        Harry
        <div
          style="position: absolute; height: 1px; clip: rect(0px, 0px, 0px, 0px);"
        >
          Potter
        </div>
      </a>
    `);
    const linkElement = document.querySelector("a");
    assert.equal(textContent(linkElement), "Harry Potter");
    const visibleLabel = fetchVisibleLabel(linkElement);
    assert.equal(visibleLabel.element.querySelector("div"), null);
    assert.equal(visibleLabel.text.replace(/\s+/g, " ").trim(), "Harry");
  });

  it("returns element without hidden children", async function () {
    await fixture(html`
      <a href="/">
        Dogs
        <div hidden="true">are cute</div>
        <div style="display: none;">and sweet</div>
      </a>
    `);
    const linkElement = document.querySelector("a");
    assert.equal(textContent(linkElement), "Dogs are cute and sweet");

    const visibleLabel = fetchVisibleLabel(linkElement);
    assert.equal(visibleLabel.text.replace(/\s+/g, " ").trim(), "Dogs");
  });
});

describe("#stripAndDowncaseText", function () {
  it("strips extra whitespace and downcases text", function () {
    const text_1 = "Join    us!!!!   ";
    const text_2 = "   HELLO WORLD!";
    assert.equal("join us!!!!", stripAndDowncaseText(text_1));
    assert.equal("hello world!", stripAndDowncaseText(text_2));
  });
});

describe("#removePunctuationAndEmoji", function () {
  it("removes punctuation and emojis from text", function () {
    const text_1 = "😂🤔!!!";
    const text_2 = "hello....";
    const text_3 = "um.. okay?";
    assert.equal(removePunctuationAndEmoji(text_1), "");
    assert.equal(removePunctuationAndEmoji(text_2), "hello");
    assert.equal(removePunctuationAndEmoji(text_3), "um okay");
  });
});

describe("#containsAnyLetters", function () {
  it("returns true if contains letters", function () {
    assert.equal(containsAnyLetters("12 commits"), true);
    assert.equal(containsAnyLetters("LOL 😂"), true);
  });

  it("returns false if contains no letters", function () {
    assert.equal(containsAnyLetters("1234"), false);
    assert.equal(containsAnyLetters("!!!"), false);
    assert.equal(containsAnyLetters("😂"), false);
    assert.equal(containsAnyLetters(" "), false);
  });
});
