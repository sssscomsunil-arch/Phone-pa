
const STARTING_BALANCE = 10000;

let balance = STARTING_BALANCE;
let transactions = [];

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.toggle("active", page.id === pageId);
  });

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === pageId
    );
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
  renderTransactions();
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.display = "block";

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.style.display = "none";
  }, 2500);
}

function formatMoney(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

function addTransaction(title, amount, type) {
  transactions.unshift({
    id: Date.now(),
    title,
    amount,
    type,
    date: new Date().toLocaleString("en-IN"),
    status: "Demo Successful"
  });

  balance -= amount;
  updateBalance();
  renderTransactions();
}

function updateBalance() {
  document.getElementById("balance").textContent =
    formatMoney(balance);
}

function renderTransactions() {
  const recent = document.getElementById("recentTransactions");
  const all = document.getElementById("allTransactions");

  function transactionHTML(tx) {
    const sign = tx.type === "credit" ? "+" : "-";
    const amountClass = tx.type === "credit" ? "credit" : "debit";

    return `
      <div class="transaction">
        <div class="tx-info">
          <strong>${escapeHTML(tx.title)}</strong>
          <small>${escapeHTML(tx.date)} · ${tx.status}</small>
        </div>
        <div class="tx-amount ${amountClass}">
          ${sign}${formatMoney(tx.amount)}
        </div>
      </div>
    `;
  }

  recent.innerHTML = transactions.length
    ? transactions.slice(0, 3).map(transactionHTML).join("")
    : '<p class="empty">No transactions yet.</p>';

  all.innerHTML = transactions.length
    ? transactions.map(transactionHTML).join("")
    : '<p class="empty">No transactions yet.</p>';
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// Demo money transfer
document.getElementById("sendForm").addEventListener("submit", event => {
  event.preventDefault();

  const receiver = document.getElementById("receiver").value.trim();
  const mobile = document.getElementById("mobile").value.trim();
  const amount = Number(document.getElementById("amount").value);

  if (!receiver || !/^\d{10}$/.test(mobile)) {
    showToast("Name aur 10-digit mobile number check karo.");
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0 || amount > balance) {
    showToast("Demo balance ya amount check karo.");
    return;
  }

  addTransaction("To " + receiver, amount, "debit");

  event.target.reset();
  showPage("home");
  showToast("Demo payment complete! Real money nahi bheje gaye.");
});

// Demo recharge and bill payment
function demoRecharge() {
  const service = document.getElementById("service").value;
  const amount = Number(document.getElementById("billAmount").value);

  if (!Number.isFinite(amount) || amount <= 0 || amount > balance) {
    showToast("Sahi amount enter karo.");
    return;
  }

  addTransaction(service, amount, "debit");

  document.getElementById("billAmount").value = "";
  showPage("home");
  showToast("Demo bill payment complete. Koi asli payment nahi hui.");
}

// Reset demo account
function resetDemo() {
  const confirmed = confirm(
    "Demo balance ₹10,000 par reset karein aur history clear karein?"
  );

  if (!confirmed) return;

  balance = STARTING_BALANCE;
  transactions = [];

  updateBalance();
  renderTransactions();
  showPage("home");
  showToast("Demo account reset ho gaya.");
}

// Initial screen
updateBalance();
renderTransactions();
showPage("home");
