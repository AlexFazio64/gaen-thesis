const fs = require("fs");
const puppeteer = require("puppeteer");
const { DOMParser } = require("xmldom");

const url = [
  "https://tvtropes.org/pmwiki/pmwiki.php/Literature/Bakemonogatari",
  "https://tvtropes.org/pmwiki/pmwiki.php/Characters/Bakemonogatari",
  "https://tvtropes.org/pmwiki/pmwiki.php/Headscratchers/Bakemonogatari",
  "https://tvtropes.org/pmwiki/pmwiki.php/NightmareFuel/Bakemonogatari",
  "https://tvtropes.org/pmwiki/pmwiki.php/ShoutOut/Bakemonogatari",
  "https://tvtropes.org/pmwiki/pmwiki.php/WMG/Bakemonogatari",
  "https://tvtropes.org/pmwiki/pmwiki.php/YMMV/Bakemonogatari",
];
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function multiple_content(url, name) {
  const browser = await puppeteer.launch({ headless: false });
  const page = (await browser.pages())[0];
  await page.goto(url);
  await page.click("[aria-label='Consent']");

  const html = await page.evaluate(() => {
    const html = document.querySelector("#main-article");
    return html.innerHTML;
  });

  let element = new DOMParser().parseFromString(html, "text/html").firstChild;

  const global = [];

  var text = "";
  var spoiler = [];
  var label = false;

  function reset() {
    text = "";
    spoiler = [];
    label = false;
  }

  function push() {
    console.log("push", text.length, spoiler.length, label);

    if (text.length > 0) {
      for (s of spoiler) {
        global.push({ text, spoiler: s, label });
      }

      if (!label) global.push({ text, spoiler: "", label });
    }
    reset();
  }

  walk_siblings(element.nextSibling);

  fs.writeFileSync(`tvtropes/${name}.json`, JSON.stringify(global, null, 2));

  function walk_siblings(element) {
    while (element.nextSibling !== null) {
      if (element.nodeName === "div") {
        console.log("div");
        push();
      }

      if (element.nodeName === "p" && element.textContent.length > 0) {
        console.log("p");
        push();
        text += element.textContent;
      }

      if (element.nodeName === "#text") {
        console.log("text");
        text += element.textContent;
      }

      if (element.nodeName === "ul") {
        console.log("ul");
        push();
      }

      if (element.nodeName === "span") {
        console.log("spoiler");
        label = true;
        spoiler.push(element.textContent);
        text += element.textContent;
      }

      element = element.nextSibling;
    }

    push();
  }
}

async function main_content(url, name) {
  const browser = await puppeteer.launch({ headless: false });
  const page = (await browser.pages())[0];
  await page.goto(url);
  await page.click("[aria-label='Consent']");

  const uls = await page.$$("#main-article ul");
  const global = [];
  for (const ul of uls) {
    const tropes = await ul.evaluate(extract);
    global.push(...tropes);
  }

  fs.writeFileSync(`tvtropes/${name}.json`, JSON.stringify(global, null, 2));
}

async function multiple_folders(url, name) {
  const browser = await puppeteer.launch({ headless: false });
  const page = (await browser.pages())[0];
  await page.goto(url);
  await page.click("[aria-label='Consent']");

  const uls = await page.$$(".folder > ul");
  const global = [];
  for (const ul of uls) {
    const tropes = await ul.evaluate(extract);
    global.push(...tropes);
  }

  fs.writeFileSync(`tvtropes/${name}.json`, JSON.stringify(global, null, 2));
}

async function single_ul(url, name) {
  const browser = await puppeteer.launch({ headless: false });
  const page = (await browser.pages())[0];
  await page.goto(url);
  await page.click("[aria-label='Consent']");

  const list = await page.waitForSelector("p + p + ul");
  const tropes = await list.evaluate(extract);

  fs.writeFileSync(`tvtropes/${name}.json`, JSON.stringify(tropes, null, 2));
}

function extract(list) {
  let tropes = [];

  const all_li = [...list.querySelectorAll("li")];

  // all_li: if an element includes <ul> tags, remove it and add a new element without <ul> tags
  all_li.forEach((li, index) => {
    if (li.querySelector("ul")) {
      const newLi = document.createElement("li");
      newLi.innerHTML = li.innerHTML.replace(/<ul>.*<\/ul>/, "");
      all_li[index] = newLi;
    }
  });

  for (const li of all_li) {
    let text = "";
    let spoiler = false;
    let spoilers = [];

    for (const node of li.childNodes) {
      if (node.nodeType === 8) continue;
      if (node.className === "notelabel") {
        text += " ";
        continue;
      }
      text += node.textContent;
      if (node.className === "spoiler" || node.className === "spoiler off") {
        spoiler = true;
        spoilers.push(node.textContent);
      }
    }

    for (s of spoilers) {
      tropes.push({ text, spoiler: s, label: spoiler });
    }

    if (!spoiler) tropes.push({ text, spoiler: "", label: spoiler });
  }
  return tropes;
}

// single_ul(url[0], "Literature");
// multiple_folders(url[1], "Characters");
// main_content(url[2], "Headscratchers");
// multiple_folders(url[3], "NightmareFuel");
// main_content(url[4], "ShoutOut");
// multiple_content(url[5], "WMG");
// main_content(url[6], "YMMV");

(() => {
  const global = [];
  fs.readdirSync("tvtropes").forEach((file) => {
    const content = JSON.parse(fs.readFileSync(`tvtropes/${file}`));
    global.push(...content);
  });

  fs.writeFileSync("tvtropes.json", JSON.stringify(global, null, 2));
  console.log("done");
})();
