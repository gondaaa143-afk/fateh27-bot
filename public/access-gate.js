(function () {
  "use strict";

  function boot() {
    /*
     * SAMBHAV UPSC
     * Standalone mode:
     * - No Telegram authentication
     * - No admin approval
     * - No access gate
     * - No sign-in requirement
     */

    const standalone =
      new URLSearchParams(location.search).get("sambhav") === "1";

    if (standalone) {
      // Keep standalone mode when navigating between HTML modules.
      document
        .querySelectorAll("a[href], button[onclick]")
        .forEach((el) => {
          const raw =
            el.getAttribute("href") ||
            el.getAttribute("onclick") ||
            "";

          if (
            /\.html(?:[?#]|$)/.test(raw) &&
            !/sambhav=1/.test(raw) &&
            el.hasAttribute("href")
          ) {
            try {
              const u = new URL(
                el.getAttribute("href"),
                location.href
              );

              if (u.origin === location.origin) {
                u.searchParams.set("sambhav", "1");

                el.setAttribute(
                  "href",
                  u.pathname + u.search + u.hash
                );
              }
            } catch (_) {}
          }
        });

      // IMPORTANT:
      // Do not create Telegram gate.
      // Do not call /api/access.
      // Do not check approval.
      return;
    }

    /*
     * FATEH27 protection remains here.
     * Do not remove this section if FATEH27
     * should remain Telegram-protected.
     */

    const tg = window.Telegram?.WebApp || null;

    if (document.getElementById("f27AccessGate")) {
      return;
    }

    const style = document.createElement("style");

    style.textContent = `
      .f27Gate{
        position:fixed;
        inset:0;
        z-index:999999;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:22px;
        background:rgba(244,244,244,.97);
        backdrop-filter:blur(24px);
        font-family:Arial,sans-serif;
      }

      .f27GateCard{
        width:min(100%,420px);
        padding:25px;
        border-radius:24px;
        background:#fff;
        border:1px solid #ddd;
        box-shadow:0 18px 55px rgba(0,0,0,.12);
        text-align:center;
      }

      .f27GateTitle{
        font-size:22px;
        font-weight:900;
      }

      .f27GateText{
        margin-top:9px;
        color:#666;
        font-size:13px;
        line-height:1.55;
      }

      .f27GateBtn{
        width:100%;
        margin-top:17px;
        border:0;
        border-radius:13px;
        padding:13px;
        background:#111;
        color:#fff;
        font-weight:800;
      }

      .f27GateStatus{
        margin-top:10px;
        color:#777;
        font-size:11px;
      }
    `;

    document.head.appendChild(style);

    const gate = document.createElement("div");

    gate.id = "f27AccessGate";
    gate.className = "f27Gate";

    gate.innerHTML = `
      <div class="f27GateCard">
        <div class="f27GateTitle">FATEH27</div>

        <div
          class="f27GateText"
          id="f27GateText"
        >
          Checking access…
        </div>

        <button
          class="f27GateBtn"
          id="f27GateBtn"
          style="display:none"
        >
          Request Access
        </button>

        <div
          class="f27GateStatus"
          id="f27GateStatus"
        ></div>
      </div>
    `;

    document.body.appendChild(gate);

    const text =
      gate.querySelector("#f27GateText");

    const btn =
      gate.querySelector("#f27GateBtn");

    const status =
      gate.querySelector("#f27GateStatus");

    const BACKEND =
      "https://fateh27-bot.onrender.com";

    function getInitData() {
      const value =
        tg?.initData ||
        sessionStorage.getItem("f27_tg_init_data") ||
        "";

      if (!tg?.initData && value) {
        try {
          new URLSearchParams(value);
        } catch (_) {
          try {
            sessionStorage.removeItem(
              "f27_tg_init_data"
            );
          } catch (_) {}

          return "";
        }
      }

      if (value) {
        try {
          sessionStorage.setItem(
            "f27_tg_init_data",
            value
          );
        } catch (_) {}
      }

      return value;
    }

    async function accessApi(options = {}) {
      const initData = getInitData();

      if (!initData) {
        throw new Error(
          "Telegram authentication is required"
        );
      }

      const headers = Object.assign(
        {},
        options.headers || {},
        {
          "x-telegram-init-data":
            initData
        }
      );

      const request = Object.assign(
        {},
        options,
        { headers }
      );

      let response;

      try {
        response = await fetch(
          BACKEND + "/api/access",
          request
        );

        if (response.status >= 500) {
          throw new Error("backend");
        }
      } catch (_) {
        response = await fetch(
          "/api/access",
          request
        );
      }

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
          data.error ||
          "Request failed"
        );
      }

      return data;
    }

    async function check() {
      try {
        const initData =
          getInitData();

        if (!initData) {
          text.textContent =
            "FATEH27 can only be opened through the authenticated Telegram Mini App.";

          return;
        }

        const data =
          await accessApi({
            method: "GET"
          });

        if (
          data.status === "approved"
        ) {
          gate.remove();
          return;
        }

        if (
          data.status === "pending"
        ) {
          text.textContent =
            "Your access request is pending admin approval.";

          return;
        }

        if (
          data.status === "rejected"
        ) {
          text.textContent =
            "Access was not approved. Contact the FATEH27 administrator.";

          return;
        }

        text.textContent =
          "Admin approval is required before entering FATEH27.";

        btn.style.display = "block";

      } catch (error) {
        text.textContent =
          "Access verification failed.";

        status.textContent =
          error?.message ||
          "Unknown verification error";
      }
    }

    btn.onclick = async function () {
      btn.disabled = true;
      btn.textContent = "Sending…";

      status.textContent =
        "Submitting request…";

      try {
        const data =
          await accessApi({
            method: "POST",
            headers: {
              "content-type":
                "application/json"
            },
            body: JSON.stringify({
              action: "request"
            })
          });

        if (
          data.status === "pending"
        ) {
          text.textContent =
            "Request sent. Wait for admin approval.";

          btn.style.display = "none";
          status.textContent = "";

          return;
        }

        if (
          data.status === "approved"
        ) {
          gate.remove();
          return;
        }

        throw new Error(
          data.detail ||
          data.error ||
          "Request failed"
        );

      } catch (error) {
        btn.disabled = false;
        btn.textContent =
          "Request Access";

        status.textContent =
          "Request failed. Please try again.";
      }
    };

    try {
      tg?.ready();
      tg?.expand();
    } catch (_) {}

    check();
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      boot,
      { once: true }
    );
  } else {
    boot();
  }
})();
