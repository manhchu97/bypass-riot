const fs = require("fs");
const path = require("path");

function handleConvertProxyTextToObj(proxy) {
  let text = proxy;
  const textArr = text.split(":");
  let obj = {
    host: textArr[0],
    port: textArr[1],
    username: textArr[2],
    password: textArr[3],
  };
  return obj;
}

async function readFileOriginal(path) {
  try {
    return fs.readFileSync(path, "utf-8");
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function readFile(root) {
  try {
    const data = fs.readFileSync(root, "utf-8");
    return data.split("\n").filter((item) => item.toString().length > 1);
  } catch (_error) {
    console.log(_error);
    return null;
  }
}

async function getProxies() {
  const proxiesText = await readFile(`${process.cwd()}/proxies.txt`);
  const proxies = proxiesText.map((proxy) =>
    handleConvertProxyTextToObj(proxy)
  );

  return proxies;
}

async function getRandomProxy() {
  const proxies = await getProxies();
  const randomIndex = Math.floor(Math.random() * proxies.length);
  return proxies[randomIndex];
}

async function getHcaptcha(client, option) {
  const responseHcaptcha = await client.get(
    "https://authenticate.riotgames.com/api/v1/login",
    option
  );

  return {
    uid: responseHcaptcha.data.suuid,
    blob: responseHcaptcha.data.captcha.hcaptcha.data,
  };
}

async function getRedirectURL(client) {
  const response = await client.get(`https://account.riotgames.com/log-in`, {});
  const redirect = response.request.res.responseUrl;
  return redirect;
}

async function syncCookies(cookieId, jar, extendObj?) {
  let serializedJar = await jar.serializeSync();
  const cookiesPath = path.resolve(
    process.cwd(), // Thư mục gốc dự án
    `cookies/${cookieId}.json`
  );

  if (extendObj) {
    serializedJar = { ...serializedJar, ...extendObj };
  }

  return fs.writeFileSync(cookiesPath, JSON.stringify(serializedJar));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getDataCookies(cookieId) {
  const cookiesPath = path.resolve(
    process.cwd(), // Thư mục gốc dự án
    `cookies/${cookieId}.json`
  );

  const clientData: any = JSON.parse(
    ((await readFileOriginal(cookiesPath)) as any) || { cookies: [] }
  );
  const cookies = clientData.cookies;
  const redirectURL = clientData.redirectURL;
  const proxy = clientData.proxy;
  const account = clientData.data;

  return {
    cookies,
    redirectURL,
    proxy,
    account,
  };
}

async function requestLogin(client, data, option) {
  try {
    const login = await client.put(
      `https://authenticate.riotgames.com/api/v1/login`,
      data,
      option
    );
    const responseData = login.data;
    return responseData;
  } catch (error) {
    return {
      error: "rate_limit",
    };
  }
}

module.exports = {
  getRandomProxy,
  getRedirectURL,
  syncCookies,
  getHcaptcha,
  wait,
  getDataCookies,
  requestLogin
};
