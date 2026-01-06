document.addEventListener("DOMContentLoaded", () => {
  const loaded = {};

  document.querySelectorAll(".tabs button").forEach(btn => {
    btn.onclick = async () => {
      // bật active UI
      document.querySelectorAll(".tabs button")
        .forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content")
        .forEach(t => t.classList.remove("active"));

      btn.classList.add("active");
      const tabId = btn.dataset.tab;
      const tabEl = document.getElementById(tabId);
      tabEl.classList.add("active");

      // load tab đúng thời điểm
      if (!loaded[tabId]) {
        const fnName = "load" + tabId.charAt(0).toUpperCase() + tabId.slice(1);
        if (typeof window[fnName] === "function") {
          console.log("LOAD", fnName);
          await window[fnName]();
        }
        loaded[tabId] = true;
      }
    };
  });

  // auto mở tab1
  document.querySelector(".tabs button")?.click();
});
