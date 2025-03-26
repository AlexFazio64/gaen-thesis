const fs = require("fs");
const { exit } = require("process");
const puppeteer = require("puppeteer");

const logStream = fs.createWriteStream("log.txt", { flags: "a" });

const LINKS_PATH = "data/links.json";
const CATEGORIES_PATH = "data/categories.json";
const CONTENT_DIR = "content/";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function func1() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("ehehehehhehe");

  let links = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll("nah"));
    return anchors.map((anchor) => ({
      id: anchor.textContent.trim(),
      url: anchor.href,
    }));
  });

  fs.writeFileSync(LINKS_PATH, JSON.stringify(links, null, 2));

  browser.close();
}

async function func2() {
  const links = JSON.parse(fs.readFileSync(LINKS_PATH));
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  let cat_arr = [];

  for (let link of links) {
    await page.goto(link.url);

    const categories = await page.evaluate(() => {
      const ctgr = Array.from(document.querySelectorAll("nah")).filter(
        (a) => !a.classList.contains("nah")
      );

      return ctgr.map((el) => {
        const a = el.querySelector("a");
        return { text: a.textContent.trim(), url: a.href };
      });
    });

    const category = {
      id: link.id,
      url: link.url,
      categories,
    };

    cat_arr = [...cat_arr, category];
  }

  fs.writeFileSync(CATEGORIES_PATH, JSON.stringify(cat_arr, null, 2));
  browser.close();
}

async function func3(link) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(link.url);

  const toc = await page.evaluate(() => {
    let lis = [];
    Array.from(document.querySelectorAll("nope")).forEach((top) => {
      let a = Array.from(top.querySelectorAll("a"));
      if (a.length > 1) {
        let main = a[0].hash;
        let subs = Array.from(top.querySelectorAll("nah")).map(
          (sub) => sub.hash
        );
        lis.push({ [main]: subs.splice(1) });
      } else lis.push(top.querySelector("a").hash);
    });

    if (lis.length === 0)
      lis = Array.from(document.querySelectorAll("nope")).map(
        (elem) => "#" + elem.id
      );

    const excludedElements = ["mmm..."];
    lis = lis.filter((elem) => !excludedElements.includes(elem));

    return lis;
  });

  const content = {
    id: link.id,
    url: link.url,
    toc,
  };

  const path = `content/${link.id.replace(/[<>:"/\\|?*]/g, "_")}`;
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
  fs.writeFileSync(`${path}/map.json`, JSON.stringify(content, null, 2));

  browser.close();
}

async function func4(page, link) {
  await page.goto(link.url);

  const description = await page.evaluate(() => {
    let lis = "";
    let arr = Array.from(document.querySelectorAll("...."));
    let curr = null;

    if (arr.length !== 0) curr = arr[0].nextElementSibling;
    else arr = Array.from(document.querySelectorAll("...."));

    if (arr.length === 0)
      curr = Array.from(document.querySelectorAll("...."))[0].firstElementChild;
    else curr = arr[0].nextElementSibling;

    while (curr !== null) {
      if (curr.id === "toc" || curr.nodeName === "H2") break;
      if (curr.nodeName !== "#comment") lis += curr.textContent;
      curr = curr.nextSibling;
    }

    return lis.trim();
  });

  return description;
}

async function func5(path) {
  let map = JSON.parse(fs.readFileSync(path + "/map.json"));

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(map.url);

  map["Description"] = await func4(page, map);

  for (let sec of map.toc) {
    if (typeof sec === "string") {
      const content = await page.evaluate(func6(), sec);
      map[sec] = content;
    } else {
      if (Object.keys(sec)[0] === "....") {
        const content = await page.evaluate(func7());
        map["...."] = content;
      } else {
        for (let sub of sec[Object.keys(sec)[0]]) {
          const content = await page.evaluate(func6(), sub);
          map[sub] = content;
        }
      }
    }
  }

  fs.writeFileSync(path + "/content.json", JSON.stringify(map, null, 2));
  browser.close();

  function func7() {
    return () => {
      let list = document.getElementById("---").parentElement;
      list = list.nextElementSibling;
      let link = [];

      while (list.nodeName !== "H2") {
        while (list.nodeName !== "UL") list = list.nextElementSibling;
        let lis = Array.from(list.querySelectorAll("li"));
        for (let li of lis)
          Array.from(li.querySelectorAll("a"))
            .map((a) => a.href)
            .forEach((a) => link.push(a));
        list = list.nextElementSibling;
      }
      return { link, text: "" };
    };
  }

  function func6() {
    return (s) => {
      let cont = {
        link: [],
        text: "",
      };

      const excludes = ["...."];
      if (excludes.includes(s)) {
        let list = document.getElementById(s.substring(1));

        if (list === null) return cont;
        list = list.parentElement;
        if (list === null) return cont;
        list = list.nextElementSibling;

        let figs = list.querySelectorAll("aaaaa");
        if (figs.length > 0) for (let fig of figs) fig.remove();

        filterLinks(Array.from(list.querySelectorAll("a")));
        cont.text += list.textContent.trim();
        return cont;
      }

      let start = document.getElementById(s.substring(1));
      if (start === null) return cont;
      start = start.parentElement;
      if (start === null) return cont;
      start = start.nextElementSibling;

      let text = "";

      if (start === null) return cont;

      while (start.nodeName === "P" || start.nodeName === "FIGURE") {
        if (start.nodeName === "FIGURE") {
          start = start.nextElementSibling;
          if (start === null) return cont; // you never know
          continue;
        }

        let span = start.querySelector("span");
        if (span !== null) {
          filterLinks(Array.from(span.querySelectorAll("a")));
          start.removeChild(span);
        }

        filterLinks(Array.from(start.querySelectorAll("a")));
        text += start.textContent;
        start = start.nextElementSibling;

        if (start === null) break; // you never know... 2
      }

      cont.text = text.trim();
      return cont;

      function filterLinks(links) {
        if (links.length > 0)
          for (let link of links)
            if (link.href.search("wwwwww") === -1) cont.link.push(link.href);
      }
    };
  }
}

function logger(message, type = "info", function_name = "", error = null) {
  message = `[${new Date().toLocaleString()}] [${type}] [@${function_name}] ${message}`;

  if (error !== null) {
    message += "\n" + error;
    logStream.write(message + "\n");
    exit(1);
  }

  logStream.write(message + "\n");
}

process.on("uncaughtException", (err) => {
  logStream.end();
});

async function start() {
  //read links.json and parsed.json
  let parsed = [];
  let links = [];

  try {
    links = JSON.parse(fs.readFileSync(LINKS_PATH));
    parsed = Array.from(JSON.parse(fs.readFileSync("data/parsed.json")));
  } catch (err) {
    return;
  }

  for (let i = 0; i < links.length; i++) {
    if (parsed.find((elem) => elem === links[i].id) !== undefined) {
      continue;
    }

    await func3(links[i]);
    await func5(`${CONTENT_DIR}${links[i].id.replace(/[<>:"/\\|?*]/g, "_")}`);

    parsed.push(links[i].id);
    fs.writeFileSync("data/parsed.json", JSON.stringify(parsed, null, 2));

    if ((i + 1) % 10 === 0) {
      await sleep(5000);
    }
  }
}

start();