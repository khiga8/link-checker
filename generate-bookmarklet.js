const fs = require("fs");

const code = fs.readFileSync("build/bundle.min.js", "utf-8");
const output =
  "javascript:" + encodeURIComponent("(function(){" + code.trim() + "})();");

fs.writeFileSync(
  "index.html",
  `
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 12%;
      text-align: center;
    }
  </style>
</head>

<h1>Link Checker Bookmarklet</h1>
<p>
  Drag the following link to your bookmarks bar:
  <a href="${output}">Link Checker</a>
</p>

<p>
 <a href="https://github.com/khiga8/link-checker">View the Source Code on GitHub</a>
</p>
`
);
