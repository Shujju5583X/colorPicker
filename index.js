// index.js
document.addEventListener("DOMContentLoaded", () => {
  const colorPicker = document.getElementById("colorPicker");
  const preview = document.getElementById("preview");
  const dropdown = document.getElementById("myDropdown");
  const applyBtn = document.getElementById("applyColorBtn");
  const colorDisplayArea = document.getElementById("colorDisplayArea");
  const status = document.getElementById("status");
  const pasteBtn = document.getElementById("pasteBtn");

  preview.style.backgroundColor = colorPicker.value;

  colorPicker.addEventListener("input", (e) => {
    preview.style.backgroundColor = e.target.value;
  });

  applyBtn.addEventListener("click", () => {
    const hex = colorPicker.value.replace("#", "");
    const mode = dropdown.value;
    getColorScheme(hex, mode, 6);
  });

  // Paste from clipboard into color picker (supports "#RRGGBB" or "RRGGBB" or "#RGB")
  pasteBtn.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      const normalized = normalizeHex(text);
      if (!normalized) {
        alert("Clipboard does not contain a valid hex color (e.g. #FF00AA or FF00AA).");
        return;
      }
      colorPicker.value = normalized;
      preview.style.backgroundColor = normalized;
    } catch (err) {
      console.error("Unable to read clipboard:", err);
      alert("Clipboard access failed. Ensure your page is served via https or localhost and you granted clipboard permission.");
    }
  });

  function normalizeHex(input) {
    if (!input) return null;
    let s = input.trim().replace(/^#/, "");
    // expand shorthand #RGB to RRGGBB
    if (/^[0-9a-fA-F]{3}$/.test(s)) {
      s = s.split("").map(ch => ch + ch).join("");
    }
    if (/^[0-9a-fA-F]{6}$/.test(s)) {
      return `#${s.toUpperCase()}`;
    }
    return null;
  }

  async function getColorScheme(hex, mode = "analogic", count = 6) {
    colorDisplayArea.innerHTML = '';
    const loading = document.createElement("div");
    loading.className = "status-text";
    loading.textContent = "Loading color scheme...";
    colorDisplayArea.appendChild(loading);

    try {
      const url = `https://www.thecolorapi.com/scheme?hex=${hex}&mode=${mode}&count=${count}&format=json`;
      const res = await fetch(url);

      const ct = res.headers.get("content-type") || "";
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      }
      if (!ct.includes("application/json")) {
        const text = await res.text();
        throw new Error("Expected JSON but got HTML/text.");
      }

      const data = await res.json();

      colorDisplayArea.innerHTML = '';

      data.colors.forEach(c => {
        const col = document.createElement("div");
        col.className = "color-column";

        const box = document.createElement("div");
        box.className = "color-box";
        box.style.backgroundColor = c.hex.value;

        // hex row: label (click to copy) + small copy button
        const hexRow = document.createElement("div");
        hexRow.className = "hex-row";

        const label = document.createElement("div");
        label.className = "hex-label";
        label.textContent = c.hex.value;

        const copyBtn = document.createElement("button");
        copyBtn.className = "copy-btn";
        copyBtn.type = "button";
        copyBtn.textContent = "Copy";

        // copy handler (works on label click or button)
        const doCopy = async () => {
          try {
            await navigator.clipboard.writeText(c.hex.value);
            showCopiedState(copyBtn, label);
          } catch (err) {
            console.error("Copy failed:", err);
            alert("Copy failed. Grant clipboard permission or try manually.");
          }
        };

        label.addEventListener("click", doCopy);
        copyBtn.addEventListener("click", doCopy);

        hexRow.appendChild(label);
        hexRow.appendChild(copyBtn);

        col.appendChild(box);
        col.appendChild(hexRow);
        colorDisplayArea.appendChild(col);
      });
    } catch (err) {
      colorDisplayArea.innerHTML = '';
      const errEl = document.createElement("div");
      errEl.className = "status-text";
      errEl.textContent = "Error fetching color scheme. See console for details.";
      colorDisplayArea.appendChild(errEl);
      console.error(err);
    }
  }

  // Visual feedback on copy
  function showCopiedState(btn, label) {
    const prevText = btn.textContent;
    btn.classList.add("copied");
    btn.textContent = "Copied!";
    // also temporarily show small feedback on label
    const origLabel = label.textContent;
    label.textContent = "Copied!";
    setTimeout(() => {
      btn.classList.remove("copied");
      btn.textContent = prevText;
      label.textContent = origLabel;
    }, 1000);
  }
  
});
