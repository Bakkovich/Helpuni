
export default async function opencab(info, tab) {
  try {
    const response = await fetch("https://sipuni.com/ru_RU/login");
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const csrfInput = doc.querySelector("input[id='login__token']");
    const csrf = csrfInput.value;
    // console.log(`CSRF: ${csrf}`);

    const loginData = {
      "login[username_email]": "dlazarev@sipuni.ru",
      "login[password]": "LightPassword64",
      "login[_token]": csrf
    };
Й
    try {
      const loginResponse = await fetch("https://sipuni.com/ru_RU/login", {
        method: "POST",
        body: JSON.stringify(loginData),
        headers: { "Content-Type": "application/json" }
      });
      if (loginResponse.status !== 200) {
        console.log("Ошибка авторизации в админку.");
        return null;
      }
    } catch (error) {
      console.log(`Ошибка авторизации в админку: ${error}`);
      return null;
    }

    const dataList = [];
    let page = 1;
    while (true) {
      const response = await fetch(`https://sipuni.com/support/server/list?filter%5B_sort_order%5D=DESC&filter%5B_page%5D=${page}&filter%5B_per_page%5D=192`);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const table = doc.querySelector("table.table.table-bordered.table-striped.sonata-ba-list");
      if (!table) break;

      const headers = Array.from(table.querySelectorAll("th")).map(header => header.textContent.trim());
      const rows = table.querySelectorAll("tbody tr");
      const data = Array.from(rows).map(row => {
        const cols = row.querySelectorAll("td");
        return headers.reduce((acc, header, i) => ({ ...acc, [header]: cols[i].textContent.trim() }), {});
      });
      dataList.push(data);
      page++;
    }

    const serverList = dataList.flat().map(srv => `${srv.id}: ${srv["IP-адрес"]}`);
    console.log(serverList);
    return serverList;
  } catch (error) {
    console.log(`Ошибка авторизации в админку: ${error}`);
    return null;
  }
    }

    /*
    const admURL = 'https://sipuni.com/manage/user/list?filter%5Bid%5D%5Btype%5D=&filter%5Bid%5D%5Bvalue%5D='+info.selectionText;

    chrome.windows.create({
        url: admURL,
        type: "normal",
        focused: true, 
        incognito: true, 
        state: "maximized"
    }); 
    */