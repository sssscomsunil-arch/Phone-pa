
const STARTING_BALANCE = 10000;
const DEMO_PIN = "1234";

let balance = STARTING_BALANCE;
let transactions = [];
let pendingPayment = null;
let scanning = false;
let cameraStream = null;
let scanFrame = null;

function showPage(id) {
  if (id !== "qr") stopScanner();

  document.querySelectorAll(".page").forEach(p =>
    p.classList.toggle("active", p.id === id)
  );

  document.querySelectorAll(".nav-item").forEach(b =>
    b.classList.toggle("active", b.dataset.page === id)
  );

  renderTransactions();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.style.display = "block";
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => el.style.display = "none", 2800);
}

function money(n) {
  return "₹" + n.toLocaleString("en-IN");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[c]);
}

function updateBalance() {
  document.getElementById("balance").textContent = money(balance);
}

function preparePayment(title, amount, mobile = "") {
  amount = Number(amount);

  if (!Number.isSafeInteger(amount) || amount < 1 || amount > balance) {
    showToast("Amount check karo. Demo balance: " + money(balance));
    return false;
  }

  pendingPayment = { title, amount, mobile };

  document.getElementById("confirmName").textContent = title;
  document.getElementById("confirmMobile").textContent =
    mobile ? "Mobile: " + mobile : "Demo bill";
  document.getElementById("confirmAmount").textContent = money(amount);
  document.getElementById("demoPin").value = "";

  showPage("confirm");
  return true;
}

document.getElementById("sendForm").addEventListener("submit", e => {
  e.preventDefault();

  const name = document.getElementById("receiver").value.trim();
  const mobile = document.getElementById("mobile").value.trim();
  const amount = Number(document.getElementById("amount").value);

  if (!name || !/^[0-9]{10}$/.test(mobile)) {
    showToast("Name aur 10-digit mobile number check karo.");
    return;
  }

  preparePayment(name, amount, mobile);
});

document.getElementById("pinForm").addEventListener("submit", e => {
  e.preventDefault();

  if (!pendingPayment) {
    showToast("Pehle demo payment shuru karo.");
    showPage("send");
    return;
  }

  if (document.getElementById("demoPin").value !== DEMO_PIN) {
    showToast("Demo PIN galat hai. Practice PIN: 1234");
    return;
  }

  if (pendingPayment.amount > balance) {
    showToast("Demo balance kam hai.");
    showPage("home");
    return;
  }

  // Demo-only transaction; no external payment is made.
  const payment = { ...pendingPayment };
  balance -= payment.amount;

  const tx = {
    id: "DEMO" + Date.now(),
    title: payment.title,
    amount: payment.amount,
    date: new Date().toLocaleString("en-IN"),
    status: "Demo Successful"
  };

  transactions.unshift(tx);
  pendingPayment = null;

  document.getElementById("successAmount").textContent = money(payment.amount);
  document.getElementById("successName").textContent = "To: " + payment.title;
  document.getElementById("successId").textContent = "Demo ID: " + tx.id;

  updateBalance();
  renderTransactions();
  showPage("success");
});

function prepareRecharge() {
  const service = document.getElementById("service").value;
  const amount = Number(document.getElementById("billAmount").value);
  preparePayment(service, amount);
}

function renderTransactions() {
  const html = transactions.length
    ? transactions.map(tx => `
      <div class="transaction">
        <div class="tx-info">
          <strong>${escapeHTML(tx.title)}</strong>
          <small>${escapeHTML(tx.date)} · DEMO ONLY</small>
          <small>${escapeHTML(tx.id)}</small>
        </div>
        <div class="tx-amount debit">-${money(tx.amount)}</div>
      </div>`).join("")
    : '<p class="empty">No demo transactions yet.</p>';

  document.getElementById("recentTransactions").innerHTML =
    transactions.slice(0, 3).length
      ? transactions.slice(0, 3).map(tx => `
        <div class="transaction">
          <div class="tx-info">
            <strong>${escapeHTML(tx.title)}</strong>
            <small>${escapeHTML(tx.date)}</small>
          </div>
          <div class="tx-amount debit">-${money(tx.amount)}</div>
        </div>`).join("")
      : '<p class="empty">No transactions yet.</p>';

  document.getElementById("allTransactions").innerHTML = html;
}

function selectService(service) {
  document.getElementById("service").value = service;
  showPage("recharge");
}

function resetDemo() {
  if (!confirm("Reset balance and clear demo history?")) return;

  balance = STARTING_BALANCE;
  transactions = [];
  pendingPayment = null;
  updateBalance();
  renderTransactions();
  showPage("home");
  showToast("Demo data reset ho gaya.");
}

// QR scanner: requires HTTPS and browser support for BarcodeDetector.
async function startScanner() {
  const video = document.getElementById("qrVideo");
  const result = document.getElementById("qrResult");

  if (!navigator.mediaDevices?.getUserMedia) {
    result.textContent = "Camera ke liye HTTPS website ko browser mein kholo.";
    return;
  }

  if (!("BarcodeDetector" in window)) {
    result.textContent = "Is browser mein QR detection supported nahi hai.";
    return;
  }

  try {
    const detector = new BarcodeDetector({ formats: ["qr_code"] });
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });

    video.srcObject = cameraStream;
    await video.play();
    scanning = true;
    result.textContent = "QR ko camera ke saamne rakho.";

    async function scan() {
      if (!scanning) return;

      try {
        const codes = await detector.detect(video);
        if (codes.length) {
          scanning = false;
          result.textContent = "QR read hua: " + codes[0].rawValue +
            " — koi payment nahi hui.";
          stopScanner();
          return;
        }
      } catch (_) {}

      if (scanning) scanFrame = requestAnimationFrame(scan);
    }

    scan();
  } catch (_) {
    result.textContent = "Camera nahi khul saka. Camera permission check karo.";
    stopScanner();
  }
}

function stopScanner() {
  scanning = false;

  if (scanFrame) cancelAnimationFrame(scanFrame);
  scanFrame = null;

  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }

  const video = document.getElementById("qrVideo");
  if (video) video.srcObject = null;
}

updateBalance();
renderTransactions();
showPage("home");
