const fs = require("fs");

const code = fs.readFileSync("build/bundle.min.js", "utf-8");
const output =
  "javascript:" + encodeURIComponent("(function(){" + code.trim() + "})();");

fs.writeFileSync(
  "index.html",
  `<h1>Link Checker Bookmarklet</h1>
<p>
  Drag the following link to your bookmarks bar:
  <a href="${output}">Link Checker</a>
</p>
`
);
