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
    const { browser, page } = await connect({
      headless: false,
      customConfig: {},
      turnstile: true,
      connectOption: {},
      proxy,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
      plugins: [require("puppeteer-extra-plugin-stealth")()],
    });
    try {
      // Mở một tab mới hoặc sử dụng tab cũ
      await page.goto(url, { waitUntil: "networkidle0" });
      await fakeMouseMovement(page);
      await page.click("#bypass");

      // Sử dụng vòng lặp để chờ phần tử #result có kết quả
      let resultText = "";
      let retries = 100; // Giới hạn số lần thử (để tránh vòng lặp vô hạn)

      while (retries > 0) {
        const el = await page.$("#result");
        if (el) {
          resultText = await page.$eval(
            "#result",
            (el) => el.textContent?.trim() || ""
          );

          // Nếu nhận được kết quả, thoát khỏi vòng lặp
          if (resultText.startsWith("success:") || resultText === "failed") {
            break;
          }
        }
        retries--;
        await wait(500); // Tạm dừng một chút trước khi thử lại
      }

      // Xử lý kết quả
      if (resultText.startsWith("success:")) {
        const token = resultText.replace("success:", "");
        resolve({ success: true, token });
        await browser.close();
      } else if (resultText === "failed") {
        resolve({ success: false, reason: "failed" });
        await browser.close();
      } else {
        resolve({ success: false, reason: "unknown_result" });
        await browser.close();
      }
    } catch (error) {
      resolve({ success: false, msg: "Lỗi không xác định" });
      await browser.close();
    }
  });
}

async function fakeMouseMovement(page) {
  const box = { x: 100, y: 100, width: 300, height: 200 };
  const steps = 25;

  for (let i = 0; i <= steps; i++) {
    const x = box.x + (box.width / steps) * i + Math.random() * 2;
    const y = box.y + (box.height / steps) * i + Math.random() * 2;
    await page.mouse.move(x, y);
    await wait(15 + Math.random() * 10);
  }

  // Optional: Hover lên nút #bypass trước khi click
  await page.hover("#bypass");
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
  const result: any = await puppeteerHandler(urlBypass, proxy);
  console.log({ ...result, proxy });
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
