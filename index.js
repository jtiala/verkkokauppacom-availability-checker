#!/usr/bin/env node
const https = require("follow-redirects").https;
const { exit } = require("process");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const { JSDOM } = require("jsdom");

const args = yargs(hideBin(process.argv)).argv;

if (Object.keys(args).includes("h")) {
  console.info("Verkkokauppa.com availability checker");
  console.info("\nusage:");
  console.info("node index.js [options] [arguments (product IDs)]");
  console.info("\nexample:");
  console.info("node index.js -m cron 45515 75645 14176");
  console.info("\noptions:");
  console.info(" -m mode");
  console.info("      available modes:");
  console.info("        - default: show output for all items");
  console.info("        - cron:    show output only for available items");
  console.info("                   (cron output can be forwarded to email)");

  exit();
}

const productIds = Array.isArray(args["_"]) ? args["_"] : [args["_"]];
const mode = args["m"] === "cron" ? "cron" : "default";

if (productIds.length === 0) {
  console.error("Please define product IDs as arguments.");
  console.info("Use node index.js -h for help.");

  exit();
}

const getUrl = (productId) =>
  `https://www.verkkokauppa.com/fi/product/${productId}`;

productIds.map((productId) => {
  const url = getUrl(productId);

  https.get(url, (res) => {
    res.setEncoding("utf8");

    let body = "";

    res.on("data", (data) => {
      body += data;
    });

    res.on("end", () => {
      const dom = new JSDOM(body);
      const title = dom.window.document.querySelector(
        "section.page__product header h1"
      ).textContent;

      const addToCartButton = dom.window.document.querySelector(
        "div.shipment-details button"
      );
      const addToCartButtonAriaDisabledAttribute =
        addToCartButton.attributes.getNamedItem("aria-disabled");

      const available = addToCartButtonAriaDisabledAttribute
        ? addToCartButtonAriaDisabledAttribute.value === false
        : true;

      const availableAmountString = available
        ? dom.window.document.querySelector("div.shipment-details div span")
            .textContent
        : "";

      if (mode === "default" || (mode === "cron" && available)) {
        console.info(`\n${title} (${productId})`);
        console.info(`${url}`);

        console.info(
          available
            ? `✅ available (${availableAmountString})`
            : `❌ not available`
        );
      }
    });
  });
});
