function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function init(username, password) {
  return new Promise((resolve, reject) => {
    const axios = require("axios");
    let data = JSON.stringify({
      username: username,
      password: password,
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "http://localhost:1997/init",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    axios
      .request(config)
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        reject(error);
        console.log(error);
      });
  });
}

const chunkArray = (array, size) => {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

async function run() {
  const accounts = [
    { username: "kenzy135", password: "khuong1491995" },
    { username: "khametroi", password: "Kha1472004?" },
    { username: "khangkhoi71", password: "khangok123" },
    { username: "khangvippro123n", password: "khangyeuzanga9" },
    { username: "khanhbo17", password: "0358653296ok" },
    { username: "khiqs123", password: "anhhayma1" },
    { username: "khoikhoizxcv", password: "0328483120zxcv" },
    { username: "khongtai123", password: "z01223450002" },
    { username: "leanhdung91", password: "0987108538nhat" },
    { username: "led0969", password: "Letrunghieu2003" },
    { username: "leductuan10", password: "tuanpro147z" },
    { username: "letuphuocmanh", password: "Letuphuocmanh1$" },
    { username: "longville2791", password: "longville123" },
    { username: "lqmoba0", password: "datxemhentai2009" },
    { username: "anhsonprohd1", password: "anhson123" },
    { username: "maitheducluong", password: "ducluong2006" },
    { username: "manhmcsl2007", password: "manh2007" },
    { username: "minhvietlmm", password: "viet0987" },
    { username: "nams2linh000", password: "nams2linh000." },
    { username: "nganby", password: "Ngan201295" },
    { username: "nganglataophang", password: "sonnguyen1997" },
    { username: "ngochongsl1108", password: "MinhNguyen06." },
    { username: "ngocthach188", password: "ta20102015" },
    { username: "nguoidaxa322", password: "nguoidensau322" },
    { username: "ngyenbac2001", password: "vip123123" },
    { username: "nhandokhac3", password: "anhnhan123" },
    { username: "0377976602t", password: "36466043a" },
    { username: "babynat2005", password: "123456789c" },
    { username: "nhienqt37qt", password: "ahtruong200" },
    { username: "nhokgoblin", password: "tuanne<3" },
    { username: "nhoxkenbj2100", password: "Thanh1304" },
    { username: "nhoxlieulinh113", password: "01869308173fa" },
    { username: "bachbum28", password: "bachbum29" },
    { username: "onghoang9d", password: "anhlahoang1" },
    { username: "phamanchi20", password: "Thuc1994" },
    { username: "phamkhoa15102001", password: "0937569167Khoa" },
    { username: "phanhuyhieu2k8", password: "huyhieu1" },
    { username: "bachlongtieuka", password: "thuhien1305" },
    { username: "quang555hn", password: "quang5258hncc" },
    { username: "quangln2004", password: "quang2004" },
    { username: "quangphilonghtc", password: "lhcatut3" },
    { username: "Quielleylena", password: "E5ZK82FUhN" },
    { username: "quyetdz231", password: "Quyetdz123" },
    { username: "Raytolfiamer", password: "832ZtdZuvZ" },
    { username: "Rbyrafial", password: "FfJxQD2g5A" },
    { username: "Rcernatteau", password: "rnKzxxWZ54" },
    { username: "sichan111", password: "phandinhhai123" },
    { username: "snail2030", password: "M4a1proo" },
    { username: "sonbuoi1410", password: "sonbuoi1" },
    { username: "sonnhan61", password: "01668664204sn" },
    { username: "tai4ssss", password: "tai0988264306" },
    { username: "Talenava1", password: "x1agKAqDFa" },
    { username: "tambui91101", password: "tamdiamai01" },
    { username: "tankert31", password: "1Ngaytuoidep" },
    { username: "bongbeo2602", password: "Bongbeo123@" },
    { username: "tdminhchien2019", password: "minhchien2019" },
    { username: "theanhwtfhjhj", password: "Hungdoi3" },
    { username: "bongsungthoi", password: "trinhminhkhanh1" },
    { username: "thuytrang23924", password: "bena2004" },
    { username: "tienhoca112", password: "01889014653a" },
    { username: "toanvip4x", password: "nhoccon123" },
    { username: "toyeucau911", password: "phuoc422001" },
    { username: "traihole1988", password: "lebinh1988" },
    { username: "trankimngan2k2", password: "Cover202" },
    { username: "trichuot092", password: "Trimayman118" },
    { username: "trinhcoicmbk", password: "quangtien2001" },
    { username: "trungpt46", password: "thanhtrung2910" },
    { username: "tuantaihe", password: "Tuantaihe1" },
    { username: "tunghssuuss", password: "Huy_06022003" },
    { username: "Uddaythust", password: "wVwM5QRRFf" },
    { username: "Uencerrishebet", password: "8tUZHj6AQT" },
    { username: "Ulenonippana", password: "GuekHsmZY1" },
    { username: "vaicalolz1", password: "dhducz123" },
    { username: "vansang041293", password: "cusangtb1" },
    { username: "viet2004st", password: "vietbuoito642k4" },
    { username: "vietanh2811lol", password: "vietanh28112000" },
    { username: "vipgiet1997", password: "anhlove97" },
    { username: "vjphibikeo42", password: "h3571740" },
    { username: "vp17042006", password: "09102017phii" },
  ];

  const batches = chunkArray(accounts, 20); // Mỗi batch 10 account

  for (const batch of batches) {
    const tasks = batch.map(({ username, password }) =>
      init(username, password)
    );
    await Promise.all(tasks);
    await wait(5000);
  }
}

run();
