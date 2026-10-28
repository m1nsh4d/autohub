
/* AutoHub: calculators, vehicle explorer, details dialog and compare tool */

// ---------- Helpers ----------
const $ = (id) => document.getElementById(id);

function rupees(n) {
  if (n >= 100000) return "₹" + (n / 100000).toFixed(2) + " L";
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function money(n) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function icon(type) {
  return { Car: "🚗", Bike: "🏍️", Scooter: "🛵" }[type] || "🚘";
}

function showResult(el, html, isError = false) {
  el.innerHTML = html;
  el.classList.toggle("error", Boolean(isError));
}

// ---------- Mileage Calculator ----------
$("mileageForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const distance = parseFloat($("mDistance").value);
  const fuel = parseFloat($("mFuel").value);
  const price = parseFloat($("mPrice").value);

  if (!(distance > 0) || !(fuel > 0)) {
    showResult($("mileageResult"), "Please enter distance and fuel greater than zero.", true);
    return;
  }

  const mileage = distance / fuel;

  let html = `Mileage: <strong>${mileage.toFixed(2)} km/l</strong>`;
  html += `<span class="line">Fuel used per 100 km: ${(100 / mileage).toFixed(2)} L</span>`;

  if (price > 0) {
    const total = fuel * price;
    html += `<span class="line">Total fuel cost: ${money(total)}</span>`;
    html += `<span class="line">Cost per km: ${money(total / distance)}</span>`;
  }

  showResult($("mileageResult"), html);
});

// ---------- Trip Cost Estimator ----------
$("tripForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const distance = parseFloat($("tDistance").value);
  const mileage = parseFloat($("tMileage").value);
  const price = parseFloat($("tPrice").value);

  if (!(distance > 0) || !(mileage > 0) || !(price > 0)) {
    showResult($("tripResult"), "Please enter values greater than zero in all fields.", true);
    return;
  }

  const litres = distance / mileage;
  const cost = litres * price;

  showResult(
    $("tripResult"),
    `Estimated cost: <strong>${money(cost)}</strong>` +
    `<span class="line">Fuel needed: ${litres.toFixed(2)} L</span>` +
    `<span class="line">Round trip cost: ${money(cost * 2)}</span>`
  );
});

// ---------- EMI Calculator ----------
$("emiForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const price = parseFloat($("ePrice").value);
  const down = parseFloat($("eDown").value) || 0;
  const rate = parseFloat($("eRate").value);
  const years = parseFloat($("eYears").value);

  if (!(price > 0) || !(years > 0) || !(rate >= 0)) {
    showResult($("emiResult"), "Please enter a valid price, rate and loan period.", true);
    return;
  }

  const loan = price - down;

  if (loan <= 0) {
    showResult($("emiResult"), "Down payment must be less than the vehicle price.", true);
    return;
  }

  const n = years * 12;
  const r = rate / 12 / 100;
  const emi = r === 0
    ? loan / n
    : (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  const total = emi * n;

  showResult(
    $("emiResult"),
    `Monthly EMI: <strong>${money(emi)}</strong>` +
    `<span class="line">Loan amount: ${money(loan)}</span>` +
    `<span class="line">Total interest: ${money(total - loan)}</span>` +
    `<span class="line">Total payable: ${money(total)}</span>`
  );
});

// ---------- Explore Vehicles ----------
const grid = $("vehicleGrid");

function getFiltered() {
  const q = $("search").value.trim().toLowerCase();
  const type = $("typeFilter").value;
  const fuel = $("fuelFilter").value;
  const maxPrice = parseInt($("maxPrice").value, 10);
  const sort = $("sortBy").value;

  const list = VEHICLES.filter((v) =>
    (type === "all" || v.type === type) &&
    (fuel === "all" || v.fuel === fuel) &&
    v.price <= maxPrice &&
    (v.name + " " + v.brand).toLowerCase().includes(q)
  );

  if (sort === "priceLow") list.sort((a, b) => a.price - b.price);
  if (sort === "priceHigh") list.sort((a, b) => b.price - a.price);
  if (sort === "mileageHigh") list.sort((a, b) => b.mileage - a.mileage);

  return list;
}

// Display an image if available; otherwise display the vehicle emoji.
function vehicleImage(v) {
  if (!v.image) {
    return `<span class="vehicle-emoji" aria-hidden="true">${icon(v.type)}</span>`;
  }

  const fallback = icon(v.type);

  return `
    <img
      src="${v.image}"
      alt="${v.name}"
      loading="lazy"
      onerror="this.onerror=null; this.replaceWith(Object.assign(document.createElement('span'), {className:'vehicle-emoji', textContent:'${fallback}'}));"
    >
  `;
}

function renderVehicles() {
  $("maxPriceLabel").textContent = rupees(parseInt($("maxPrice").value, 10));

  const list = getFiltered();

  $("count").textContent = `Showing ${list.length} of ${VEHICLES.length} vehicles`;

  if (list.length === 0) {
    grid.innerHTML = '<p class="empty">No vehicles match your filters. Try changing them.</p>';
    return;
  }

  grid.innerHTML = list.map((v) => `
    <article class="vehicle">
      <div class="vehicle-top">
        ${vehicleImage(v)}
      </div>

      <div class="vehicle-body">
        <h3>${v.name}</h3>
        <p class="brand">${v.brand}</p>

        <div class="badges">
          <span class="badge">${v.type}</span>
          <span class="badge fuel-${v.fuel}">${v.fuel}</span>
        </div>

        <div class="stats">
          <div class="stat">
            <span>Price from</span>
            <strong>${rupees(v.price)}</strong>
          </div>

          <div class="stat">
            <span>Mileage</span>
            <strong>${v.mileage} ${v.unit}</strong>
          </div>
        </div>

        <button type="button" class="btn btn-primary view-btn" data-id="${v.id}">
          View Details
        </button>
      </div>
    </article>
  `).join("");
}

["search", "typeFilter", "fuelFilter", "sortBy", "maxPrice"].forEach((id) => {
  $(id).addEventListener("input", renderVehicles);
});

// ---------- Details Dialog ----------
const dialog = $("detailDialog");

grid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-id]");
  if (!btn) return;

  const v = VEHICLES.find((x) => x.id === Number(btn.dataset.id));
  if (!v) return;

  $("detailContent").innerHTML = `
    <h3>${icon(v.type)} ${v.name}</h3>
    ${v.image ? `<img class="detail-image" src="${v.image}" alt="${v.name}" onerror="this.style.display='none'">` : ""}
    <p class="about-text">${v.about}</p>

    <table class="spec-table">
      <tr><th>Brand</th><td>${v.brand}</td></tr>
      <tr><th>Type</th><td>${v.type}</td></tr>
      <tr><th>Fuel</th><td>${v.fuel}</td></tr>
      <tr><th>Approx. price</th><td>${rupees(v.price)} (ex-showroom)</td></tr>
      <tr><th>Mileage / range</th><td>${v.mileage} ${v.unit}</td></tr>
      <tr><th>Engine / motor</th><td>${v.engine}</td></tr>
      <tr><th>Power</th><td>${v.power}</td></tr>
      <tr><th>Transmission</th><td>${v.transmission}</td></tr>
      <tr><th>Seating</th><td>${v.seats}</td></tr>
      <tr><th>Fuel tank / battery</th><td>${v.tank}</td></tr>
    </table>
  `;

  dialog.showModal();
});

$("closeDialog").addEventListener("click", () => dialog.close());

dialog.addEventListener("click", (e) => {
  if (e.target === dialog) dialog.close();
});

// ---------- Compare Vehicles ----------
const selA = $("cmpA");
const selB = $("cmpB");

function fillSelects() {
  if (VEHICLES.length === 0) return;

  const options = VEHICLES.map((v) =>
    `<option value="${v.id}">${v.name}</option>`
  ).join("");

  selA.innerHTML = options;
  selB.innerHTML = options;

  selA.value = VEHICLES[0].id;
  selB.value = (VEHICLES[2] || VEHICLES[0]).id;
}

function renderCompare() {
  const a = VEHICLES.find((v) => v.id === Number(selA.value));
  const b = VEHICLES.find((v) => v.id === Number(selB.value));

  if (!a || !b) return;

  const cheaper = a.price === b.price ? "" : a.price < b.price ? "a" : "b";
  const sameUnit = a.unit === b.unit;
  const efficient = !sameUnit || a.mileage === b.mileage
    ? ""
    : a.mileage > b.mileage ? "a" : "b";

  const cell = (side, winner, text) =>
    `<td class="${side === winner ? "win" : ""}">${text}</td>`;

  const row = (label, x, y, winner) =>
    `<tr><th>${label}</th>${cell("a", winner, x)}${cell("b", winner, y)}</tr>`;

  $("compareTable").innerHTML = `
    <thead>
      <tr><th>Feature</th><th>${a.name}</th><th>${b.name}</th></tr>
    </thead>
    <tbody>
      ${row("Approx. price", rupees(a.price), rupees(b.price), cheaper)}
      ${row("Mileage / range", `${a.mileage} ${a.unit}`, `${b.mileage} ${b.unit}`, efficient)}
      ${row("Type", a.type, b.type, "")}
      ${row("Fuel", a.fuel, b.fuel, "")}
      ${row("Engine / motor", a.engine, b.engine, "")}
      ${row("Power", a.power, b.power, "")}
      ${row("Transmission", a.transmission, b.transmission, "")}
      ${row("Seating", a.seats, b.seats, "")}
      ${row("Fuel tank / battery", a.tank, b.tank, "")}
    </tbody>
  `;
}

selA.addEventListener("change", renderCompare);
selB.addEventListener("change", renderCompare);

// ---------- Start ----------
fillSelects();
renderCompare();
renderVehicles();
