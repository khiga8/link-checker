import { assert, fixture, html } from "@open-wc/testing";
import { containsAnyLetters } from "../build/bundle.min.js";

describe("index.js", function () {
  describe("#containsAnyLetters", function () {
    it("returns true if contains letters", function () {
      debugger;
      assert.equal(true, containsAnyLetters("1234"));
    });
  });
});
