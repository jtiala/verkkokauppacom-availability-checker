#!/usr/bin/env node
const https = require("follow-redirects").https;
const { exit } = require("process");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const { JSDOM } = require("jsdom");

const args = yargs(hideBin(process.argv)).argv;

const productIds = Array.isArray(args["_"]) ? args["_"] : [args["_"]];
const mode = args["m"] === "cron" ? "cron" : "default";

const output = (content, type = "info", alwaysPrint = false) => {
  if (mode === "default" || alwaysPrint) {
    if (type === "error") {
      console.error(content);
    } else {
      console.info(content);
    }
  }
};

if (Object.keys(args).includes("h")) {
  output("Verkkokauppa.com availability checker", "info", true);
  output("\nusage:", "info", true);
  output("node index.js [options] [arguments (product IDs)]", "info", true);
  output("\nexample:", "info", true);
  output("node index.js -m cron 45515 75645 14176", "info", true);
  output("\noptions:", "info", true);
  output(" -m mode", "info", true);
  output("      available modes:", "info", true);
  output("        - default: show output for all items", "info", true);
  output(
    "        - cron:    show output only for available items",
    "info",
    true
  );
  output(
    "                   (cron output can be forwarded to email)",
    "info",
    true
  );

  exit();
}

if (productIds.length === 0) {
  output("Please define product IDs as arguments.", "error", true);
  output("Use node index.js -h for help.", "info", true);

  exit();
}

const getUrl = (productId) =>
  `https://www.verkkokauppa.com/fi/product/${productId}`;

productIds.map((productId) => {
  const url = getUrl(productId);

  https.get(url, (res) => {
    if (res.statusCode !== 200) {
      output("Product page not found", "error");
      return;
    }

    res.setEncoding("utf8");

    let body = "";

    res.on("data", (data) => {
      body += data;
    });

    res.on("end", () => {
      const dom = new JSDOM(body);

      const headerElement = dom.window.document.querySelector(
        "section.page__product header h1"
      );

      const addToCartButtonElement = dom.window.document.querySelector(
        "div.shipment-details button"
      );

      const addToCartButtonAriaDisabledAttribute = addToCartButtonElement
        ? addToCartButtonElement.attributes.getNamedItem("aria-disabled")
        : undefined;

      const availableAmountElement = dom.window.document.querySelector(
        "div.shipment-details div span"
      );

      if (!headerElement) {
        output("Product page not loaded correctly", "error");
        return;
      }

      const title = headerElement.textContent;

      const available = addToCartButtonAriaDisabledAttribute
        ? addToCartButtonAriaDisabledAttribute.value === false
        : true;

      const amount = availableAmountElement
        ? availableAmountElement.textContent
        : undefined;

      output(`\n${title} (${productId})`, "info", available);
      output(`${url}`, "info", available);
      output(
        available && amount
          ? `✅ available (${amount})`
          : available
          ? `✅ available`
          : `❌ not available`,
        "info",
        available
      );
    });
  });
});
