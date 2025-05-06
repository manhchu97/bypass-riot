const cors = require("cors");
const express = require("express");
const { CookieJar, Cookie } = require("tough-cookie");
const { wrapper } = require("./axios-cookiejar-support/src");
const fs = require("fs");
const axios = require("axios");
const path = require("path");
const {
  getRandomProxy,
  getRedirectURL,
  getHcaptcha,
  syncCookies,
  getDataCookies,
  wait,
  requestLogin,
} = require("./common/util");
const { connect } = require("puppeteer-real-browser");

const headersDefault = {
  Accept: "application/json",
  Connection: "keep-alive",
  "Content-Type": "application/json",
  Host: "authenticate.riotgames.com",
  Origin: "https://authenticate.riotgames.com",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
};

const app = express();
const port = 1997;

async function puppeteerHandler(url, proxy) {
  return new Promise(async (resolve, reject) => {
    try {
      const { browser, page } = await connect({
        headless: false,
        customConfig: {},
        turnstile: true,
        connectOption: {},
        proxy,
      });

      await page.setRequestInterception(true);

      page.on("request", async (request) => {
        const url = request.url();
        if (url.includes("challenge.js")) {
          await browser.close();
          resolve({ success: false, msg: "Dính captcha !!!" });
          return;
        }
        await request.continue();
      });

      page.on("response", async (response) => {
        const url = response.url();

        if (url.includes("https://api.hcaptcha.com/getcaptcha")) {
          const status = response.status();
          if (status === 400) {
            await browser.close();
            resolve({ success: false, msg: "Captcha trả về status 400 !!!" });
          }
        }

        if (url.includes("webhook")) {
          try {
            await response.text(); // hoặc response.json() nếu biết chắc là JSON

            resolve({ success: true });
            await browser.close(); // đóng sau khi đã nhận xong body
          } catch (e) {
          }
        }
      });

      await page.goto(url, { waitUntil: "networkidle0" });
      await page.click("#bypass");
    } catch (error) {
      console.log(error)
      resolve({ success: false, msg: "Lỗi không xác định" });
    }
  });
}

app.use(
  cors({
    origin: "*", // Cho phép tất cả các origin
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Các method cho phép
    allowedHeaders: ["Content-Type", "Authorization"], // Các header cho phép
  })
);
app.use(express.json()); // Middleware để parse JSON body

// POST /init
app.post("/init", async (req, res) => {
  const data = req.body;
  const proxy = await getRandomProxy();
  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar }), proxy);
  const redirectURL = await getRedirectURL(client);
  const hcaptcha = await getHcaptcha(client, {
    headers: {
      Referer: redirectURL,
    },
  });

  const urlBypass = `http://localhost:3000?uid=${
    hcaptcha.uid
  }&blob=${encodeURIComponent(hcaptcha.blob)}`;
  await syncCookies(hcaptcha.uid, jar, { redirectURL, proxy, data });
  const result = await puppeteerHandler(urlBypass, proxy);
  res.json(result);
});

app.post("/webhook", async (req, res) => {
  const payload = req.body;
  const { cookies, redirectURL, proxy, account } = await getDataCookies(
    payload.uid
  );
  const jar = new CookieJar();
  const objConfig: any = { jar };
  const client = wrapper(axios.create(objConfig), proxy);
  cookies.forEach((cookieData) => {
    const cookie = new Cookie(cookieData); // Tạo đối tượng cookie từ dữ liệu
    jar.setCookieSync(cookie.toString(), `https://${cookieData.domain}`); // Thiết lập cookie vào CookieJar
  });

  const data = {
    type: "auth",
    remember: false,
    language: "vi_VN",
    riot_identity: {
      username: account.username,
      password: account.password,
      captcha: `hcaptcha ${payload.token}`,
    },
  };

  try {
    const resLogin = await requestLogin(client, data, {
      headers: {
        ...headersDefault,
        Referer: `${redirectURL}`,
      },
    });

    if (resLogin.type === "success") {
      console.log(`[${account.username}]=> Success !`);
    } else {
      console.log(resLogin);
      console.log(`[${account.username}]=> Failed`);
    }
  } catch (error) {
    console.log(error);
    console.log(`[${account.username}]=> Failed !`);
  }

  res.status(200).json({ message: "Webhook received" });
});

app.listen(port, () => {
  console.log(`Express service listening at http://localhost:${port}`);
});
