const $ = (id) => document.getElementById(id);

let expression = "";
let degreeMode = true;
let history = [];

function showExpression() {
  $("expression").textContent = expression || "0";
}

function calculate(expr) {
    if (!expr.trim()) return 0;
  expr = expr.replace(/√\s*\(/g, "sqrt(");
expr = expr.replace(/√\s*(\d+(\.\d+)?)/g, "sqrt($1)");
  const scope = {
    sin: (x) => Math.sin(degreeMode ? x * Math.PI / 180 : x),
    cos: (x) => Math.cos(degreeMode ? x * Math.PI / 180 : x),
    tan: (x) => Math.tan(degreeMode ? x * Math.PI / 180 : x),
    log10: (x) => Math.log10(x),
    sqrt: (x) => Math.sqrt(x),
    pi: Math.PI,
    e: Math.E
  };
  const result = math.evaluate(expr, scope);
  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new Error("Result is not a finite number.");
  }
  return result;
}

function formatNumber(value) {
  return Number(value.toPrecision(12)).toLocaleString("en-US", {
    maximumFractionDigits: 10,
    useGrouping: true
  });
}

function updateResult() {
  showExpression();
  try {
    const value = calculate(expression);
    $("result").textContent = formatNumber(value);
    $("calcMessage").textContent = "Calculation ready";
  } catch {
    $("result").textContent = expression ? "…" : "0";
    $("calcMessage").textContent = "Enter a complete expression";
  }
}

function addHistory(expr, result) {
  history.unshift({ expr, result });
  history = history.slice(0, 50);
  $("historyList").innerHTML = "";
  history.forEach((item) => {
    const row = document.createElement("button");
    row.className = "history-item";
    row.style.cssText =
      "display:block;width:100%;text-align:left;color:inherit;background:transparent;border:0;cursor:pointer";
    const first = document.createElement("span");
    first.textContent = item.expr;
    const second = document.createElement("small");
    second.textContent = "= " + formatNumber(item.result);
    row.append(first, second);
    row.addEventListener("click", () => {
      expression = item.expr;
      updateResult();
    });
    $("historyList").append(row);
  });
}

function performEquals() {
  try {
    const oldExpression = expression;
    const value = calculate(expression);
    $("result").textContent = formatNumber(value);
    $("calcMessage").textContent = "✓ Calculated successfully";
    addHistory(oldExpression, value);
    expression = String(value);
    showExpression();
  } catch {
    $("calcMessage").textContent = "Please check your expression";
  }
}

$("keypad").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const value = button.dataset.value;
  const action = button.dataset.action;

  if (action === "clear") {
    expression = "";
    $("result").textContent = "0";
    $("calcMessage").textContent = "Ready to calculate";
    showExpression();
    return;
  }

  if (action === "backspace") {
    expression = expression.slice(0, -1);
    updateResult();
    return;
  }

  if (action === "equals") {
    performEquals();
    return;
  }

  if (action === "sign") {
    expression = expression ? `-1*(${expression})` : "-";
    updateResult();
    return;
  }

  if (value !== undefined) {
    expression += value;
    updateResult();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.target.matches("input, textarea, select")) return;

  if (/^[0-9.+\-*/()%]$/.test(event.key) || event.key === "^") {
    expression += event.key;
    updateResult();
  } else if (event.key === "Enter") {
    event.preventDefault();
    performEquals();
  } else if (event.key === "Backspace") {
    expression = expression.slice(0, -1);
    updateResult();
  } else if (event.key === "Escape") {
    expression = "";
    updateResult();
  }
});

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    button.classList.add("active");
    $(button.dataset.panel).classList.add("active");
  });
});

$("historyBtn").addEventListener("click", () => {
  $("historyBox").classList.toggle("hidden");
});

$("clearHistory").addEventListener("click", () => {
  history = [];
  $("historyList").textContent = "No calculations yet.";
});

$("angleBtn").addEventListener("click", () => {
  degreeMode = !degreeMode;
  $("angleBtn").textContent = "Angle: " + (degreeMode ? "DEG" : "RAD");
  updateResult();
});

$("copyBtn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("result").textContent);
    $("calcMessage").textContent = "Result copied";
  } catch {
    $("calcMessage").textContent = "Copy unavailable in this browser";
  }
});

$("themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("light");
});

$("pctBtn").addEventListener("click", () => {
  const n = Number($("pctNum").value);
  const p = Number($("pctRate").value);
  if (!$("pctNum").value.trim() || !$("pctRate").value.trim()) {
    $("pctResult").textContent = "Enter both values.";
    return;
  }
  $("pctResult").textContent = `${p}% of ${n} = ${formatNumber(n * p / 100)}`;
});

$("avgBtn").addEventListener("click", () => {
  const raw = $("avgNums").value.trim();
  const values = raw.split(",").map((s) => s.trim());
  if (!raw || values.some((s) => s === "" || !Number.isFinite(Number(s)))) {
    $("avgResult").textContent = "Enter numbers separated by commas.";
    return;
  }
  const nums = values.map(Number);
  $("avgResult").textContent =
    `Average = ${formatNumber(nums.reduce((a, b) => a + b, 0) / nums.length)}`;
});

$("siBtn").addEventListener("click", () => {
  const raw = [$("siP").value, $("siR").value, $("siT").value];
  if (raw.some((v) => v.trim() === "" || !Number.isFinite(Number(v)) || Number(v) < 0)) {
    $("siResult").textContent = "Enter valid non-negative values.";
    return;
  }
  const [p, r, t] = raw.map(Number);
  const interest = p * r * t / 100;
  $("siResult").textContent =
    `Interest: ₹${formatNumber(interest)} · Total: ₹${formatNumber(p + interest)}`;
});

$("unitBtn").addEventListener("click", () => {
  const raw = $("unitValue").value;
  if (raw.trim() === "" || !Number.isFinite(Number(raw))) {
    $("unitResult").textContent = "Enter a valid number.";
    return;
  }

  const n = Number(raw);
  const conversions = {
    "m-km": [n / 1000, "km"],
    "km-m": [n * 1000, "m"],
    "cm-m": [n / 100, "m"],
    "m-cm": [n * 100, "cm"],
    "kg-g": [n * 1000, "g"],
    "g-kg": [n / 1000, "kg"],
    "c-f": [n * 9 / 5 + 32, "°F"],
    "f-c": [(n - 32) * 5 / 9, "°C"]
  };

  const [result, unit] = conversions[$("unitType").value];
  $("unitResult").textContent = `${formatNumber(result)} ${unit}`;
});

document.querySelectorAll(".suggestion").forEach((button) => {
  button.addEventListener("click", () => {
    $("aiInput").value = button.dataset.prompt;
    $("aiInput").focus();
  });
});

function addMessage(text, type) {
  const message = document.createElement("div");
  message.className = "message " + type;
  message.textContent = text;
  $("chatMessages").append(message);
  $("chatMessages").scrollTop = $("chatMessages").scrollHeight;
}

$("aiForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const question = $("aiInput").value.trim();
  if (!question) return;

  addMessage(
    "AI Assistant abhi maintenance mein hai. Filhaal calculator ke saare available tools use karo. AI feature baad mein activate kiya jayega.",
    "assistant"
  );
});

updateResult();