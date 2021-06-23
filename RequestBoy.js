const axios = require("axios");
const prettyBytes = require("pretty-bytes");

const { Editor } = require("./Editor");

//----------------//
//   AXIOS STUFF  //
//----------------//

axios.interceptors.request.use((request) => {
  request.customData = {};
  request.customData.startTime = new Date().getTime();
  return request;
});

function updateEndTime(response) {
  response.customData = response.customData || {};
  response.customData.time =
    new Date().getTime() - response.config.customData.startTime;
  return response;
}

axios.interceptors.response.use(updateEndTime, (e) => {
  return Promise.reject(updateEndTime(e.response));
});

//----------------//
//     EDITOR     //
//----------------//

const jsonRequestBody = document.getElementById("request-data");
const jsonResponseBody = document.getElementById("response-data");

const editor = new Editor(jsonRequestBody, jsonResponseBody);

//----------------//
//   REQUESTBOY   //
//----------------//

class RequestBoy {
  constructor() {
    this.method = "GET";
    this.url = "";
    this.queryParams = {};
    this.headers = {};
    this.data = "";
  }

  updateQueryParamList() {
    const list = document.getElementById("query-params-list");

    const that = this;

    function removeQueryParam(queryParam) {
      const newQueryParams = {};

      Object.keys(that.queryParams).map((param) => {
        if (param !== queryParam) {
          newQueryParams[param] = that.queryParams[param];
        }
      });

      that.queryParams = newQueryParams;
    }

    function addQueryParam(key, value) {
      that.queryParams = { ...that.queryParams, [key]: value };
    }

    Object.keys(that.queryParams).map((paramKey) => {
      const template = `
        <div class="input-group my-2 item">
          <input
            type="text"
            class="form-control"
            placeholder="Key"
            value="${paramKey}"
            readonly
          />
          <input
            type="text"
            class="form-control"
            placeholder="Value"
            value="${that.queryParams[paramKey]}"
          />
          <button
            type="button"
            class="btn btn-outline-danger"
          >
            Remove
          </button>
        </div>`;

      list.innerHTML += template;

      list.lastChild
        .getElementsByTagName("button")[0]
        .addEventListener("click", (e) => {
          const container = e.target.closest(".item");

          removeQueryParam(paramKey);

          container.remove();
        });

      list.lastChild
        .getElementsByTagName("input")[1]
        .addEventListener("change", (e) => {
          addQueryParam(paramKey, e.target.value);
        });
    });
  }

  updateHeaderList() {
    const list = document.getElementById("headers-list");

    const that = this;

    function removeHeader(header) {
      const newHeaders = {};

      Object.keys(that.headers).map((h) => {
        if (h !== header) {
          newHeaders[h] = that.headers[h];
        }
      });

      that.headers = newHeaders;
    }

    function addHeader(key, value) {
      that.headers = { ...that.headers, [key]: value };
    }

    Object.keys(that.headers).map((headerName) => {
      const template = `
        <div class="input-group my-2 item">
          <input
            type="text"
            class="form-control"
            placeholder="Key"
            value="${headerName}"
            readonly
          />
          <input
            type="text"
            class="form-control"
            placeholder="Value"
            value="${that.headers[headerName]}"
          />
          <button
            type="button"
            class="btn btn-outline-danger"
          >
            Remove
          </button>
        </div>`;

      list.innerHTML += template;

      list.lastChild
        .getElementsByTagName("button")[0]
        .addEventListener("click", (e) => {
          const container = e.target.closest(".item");

          removeHeader(headerName);

          container.remove();
        });

      list.lastChild
        .getElementsByTagName("input")[1]
        .addEventListener("change", (e) => {
          addHeader(headerName, e.target.value);
        });
    });
  }

  init() {
    const that = this;

    document
      .getElementsByTagName("form")[0]
      .addEventListener("submit", function (e) {
        e.preventDefault();

        function updateResponseDetails(response) {
          document.getElementById("response-status").textContent =
            response.status;
          document.getElementById("response-time").textContent =
            response.customData.time;
          document.getElementById("response-size").textContent = prettyBytes(
            JSON.stringify(response.data).length +
              JSON.stringify(response.headers).length
          );
        }

        function updateResponseHeaders(headers) {
          const responseHeadersContainer = document.getElementById(
            "response-headers-div"
          );

          responseHeadersContainer.innerHTML = "";

          Object.entries(headers).forEach(([key, value]) => {
            const keyElement = document.createElement("div");
            keyElement.textContent = key;

            responseHeadersContainer.append(keyElement);

            const valueElement = document.createElement("div");
            valueElement.textContent = value;

            responseHeadersContainer.append(valueElement);
          });
        }

        let json;
        try {
          json = JSON.parse(editor.requestEditor.state.doc.toString() || null);
        } catch (e) {
          alert("JSON data is malformed");
          return;
        }

        that.url = document.getElementById("url-input").value;
        that.method = document.getElementById("method-input").value;

        axios({
          url: that.url,
          method: that.method,
          params: that.queryParams,
          headers: that.headers,
          data: json,
        })
          .catch((e) => e)
          .then((response) => {
            document
              .getElementById("response-section")
              .classList.remove("d-none");
            updateResponseDetails(response);
            editor.updateResponseEditor(response.data);
            updateResponseHeaders(response.headers);
          });
      });

    document
      .getElementById("method-input")
      .addEventListener("change", function (e) {
        this.method = e.target.value;
      });

    document
      .getElementById("url-input")
      .addEventListener("change", function (e) {
        this.url = e.target.value;
      });

    document
      .getElementById("add-param-btn")
      .addEventListener("click", function () {
        const key = document.getElementById("param-key");
        const value = document.getElementById("param-value");

        that.queryParams = { ...that.queryParams, [key.value]: value.value };

        that.updateQueryParamList();

        key.value = "";
        value.value = "";
      });
    document
      .getElementById("add-header-btn")
      .addEventListener("click", function () {
        const key = document.getElementById("header-key");
        const value = document.getElementById("header-value");

        that.headers = { ...that.headers, [key.value]: value.value };

        that.updateHeaderList();

        key.value = "";
        value.value = "";
      });

    this.updateQueryParamList();
    this.updateHeaderList();
  }
}

module.exports = { RequestBoy };
