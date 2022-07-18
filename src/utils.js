import "../vendors/recursion.js";

export function containsAnyLetters(str) {
  return /[a-zA-Z]/.test(str);
}

export function removePunctuationAndEmoji(text) {
  return text
    .replace(/[.,/#!$%^&*;:{}=-_`~()+-]/g, "")
    .replace(/s{2,}/g, " ")
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ""
    );
}

function isInlineElement(node) {
  return (
    window.getComputedStyle(node, null).getPropertyValue("display") === "inline"
  );
}

/* Get element text with appropriate whitespaces. */
export function innerText(element) {
  function getTextLoop(element) {
    const texts = [];
    Array.from(element.childNodes).forEach((node) => {
      if (node.nodeType === 3) {
        texts.push(node.textContent);
      } else {
        if (node.nodeType === 1 && !isInlineElement(node)) {
          texts.push(" ");
        }
        texts.push(...getTextLoop(node));
      }
    });
    return texts;
  }
  return getTextLoop(element).join("").trim();
}

export function isAriaHidden(element) {
  const ariaHidden =
    element.hasAttribute("aria-hidden") && element.getAttribute("aria-hidden");
  const closestAriaHidden =
    element.closest("[aria-hidden]") && element.getAttribute("aria-hidden");
  return ariaHidden || closestAriaHidden;
}

export function fetchVisibleLabel(element) {
  const clonedLink = element.cloneNode(true);
  element.insertAdjacentElement("afterend", clonedLink);
  removeVisuallyHiddenElements(clonedLink);
  const visibleLabelElement = clonedLink;
  const visibleLabelText = innerText(visibleLabelElement);
  clonedLink.remove();

  return { element: clonedLink, text: visibleLabelText };
}

export function fetchAccessibleName(element) {
  const clonedLink = element.cloneNode(true);
  element.insertAdjacentElement("afterend", clonedLink);
  clonedLink.querySelectorAll("noscript").forEach((noscript) => {
    noscript.remove();
  });
  const accessibleName = clonedLink && getAccName(clonedLink).name;
  clonedLink.remove();

  return accessibleName;
}

/* Removes visuallly hidden element. */
export function removeVisuallyHiddenElements(el) {
  if (isScreenReaderOnly(el) || el.tagName === "NOSCRIPT" || isHidden(el)) {
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
export function isScreenReaderOnly(element) {
  const computedStyle = window.getComputedStyle(element);
  return (
    computedStyle.height === "1px" &&
    computedStyle.position === "absolute" &&
    computedStyle.clip === "rect(0px, 0px, 0px, 0px)"
  );
}

/* Determines if link is visually hidden and not exposed to accessibility API. */
export function isHidden(element) {
  return (
    element.offsetParent === null ||
    window.getComputedStyle(element).visibility === "hidden" ||
    window.getComputedStyle(element).display === "none"
  );
}

export function stripAndDowncaseText(text) {
  return text.replace(/\s+/g, " ").toLowerCase().trim();
}
