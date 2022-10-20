function getUrl() {
    if (window.location.hostname === "localhost") {
        return "http://localhost:9090";
    } else {
        return window.location.origin;
    }
}

async function callApi(method, api, data = {}) {
    const baseUrl = getUrl();

    const fullURI = baseUrl + "/" + api;

    let fullURL = fullURI;

    const options = {
        method,
        headers: {},
    };

    if (method === "GET") {
        const queryList = [];
        Object.keys(data).forEach((key) => {
            let value = data[key];
            if (typeof value === "object") {
                value = JSON.stringify(value);
            }
            queryList.push(`${key}=${value}`);
        });

        if (queryList.length > 0) {
            fullURL += "?" + queryList.join("&");
        }
    } else if (method === "POST") {
        options.headers['Content-Type'] = "application/json";
        options.body = JSON.stringify(data);
    }

    const result = await fetch(fullURL);
    if (!result.ok) {
        console.error("Result got " + result.status + " for " + result.url);
        return null;
    }

    const json = await result.json();

    return json;
}

export default callApi;