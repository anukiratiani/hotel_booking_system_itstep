"use strict";

// მთელი აპლიკაციის მეხსიერება
let hotels   = [];      // სასტუმროების სია (+ოთახები)
let bookings = [];      // ჯავშნები
let currentHotelId = null;  // რომელი სასტუმროს ნომრების გვერდზე ვართ
let bookingRoomId  = null;  // რომელ ოთახს ვჯავშნით ახლა

// გაშვება
window.addEventListener("DOMContentLoaded", async () => {
  setupNav();
  await loadData();
  renderHotelsPage();
  setupHotelFilter();
  setupBookedFilter();
  setupModalPricePreview();
  });

  // მონაცემების ჩატვირთვა JSON ფაილებიდან (სასტუმროები + ჯავშნები)
async function loadData() {
  try {
    const [hRes, bRes] = await Promise.all([
      fetch("data/hotels.json"),
      fetch("data/bookings.json"),
    ]);
    hotels   = await hRes.json();
    bookings = await bRes.json();
  } catch (e) {
    showToast("მონაცემების ჩატვირთვა ვერ მოხერხდა.");
    hotels = []; bookings = [];
  }
}

async function saveBookings() {
  try {
    localStorage.setItem("tekhili_bookings", JSON.stringify(bookings));
  } catch {}
}

// აპლიკაციის გაშვებისას ვცდილობთ ადგილობრივად შენახული ჯავშნების აღდგენას, რომ არ დაიკარგოს ინფორმაცია გვერდის გადატვირთვისას.
(function restoreLocalBookings() {
  try {
    const saved = localStorage.getItem("tekhili_bookings");
    if (saved) bookings = JSON.parse(saved);
  } catch {}
})();

// ნავიგაციის დაყენება
function setupNav() {
  document.querySelectorAll(".nav-link").forEach(a => {
    a.addEventListener("click", e => {
      e.preventDefault();
      showPage(a.dataset.page);
    });
  });
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-link").forEach(a => {
    a.classList.toggle("active", a.dataset.page === pageId);
  });
  const el = document.getElementById("page-" + pageId);
  if (el) el.classList.add("active");

  if (pageId === "booked") renderBookedPage();
}

// აპლიკაციის ლოგიკა თითოეულ გვერდზე

// სასტუმროების გვერდი
function renderHotelsPage(filtered) {
  const list = filtered !== undefined ? filtered : hotels;
  const grid = document.getElementById("hotels-grid");

  if (list.length === 0) {
    grid.innerHTML = `<div class="empty-state"><p>სასტუმრო ვერ მოიძებნა.</p></div>`;
    return;
  }

  grid.innerHTML = list.map(h => buildHotelCard(h)).join("");
}

function buildHotelCard(h) {
  const stars = "★".repeat(h.stars) + "☆".repeat(5 - h.stars);
  const imgHtml = h.image
    ? `<img src="${h.image}" alt="${h.name}" style="width:100%;height:100%;object-fit:cover;" />`
    : `<div class="card-img-placeholder"><span>ფოტო</span></div>`;

  return `
  <div class="card" onclick="openHotelRooms(${h.id})">
    <div class="card-img">${imgHtml}</div>
    <div class="card-body">
      <div class="card-title">${h.name}</div>
      <div class="card-subtitle">${h.city}</div>
      <div class="card-meta">
        <span class="stars">${stars}</span>
        <span class="rating-box">${h.rating}</span>
      </div>
      <div style="font-size:12px;color:var(--gray)">${h.address}</div>
    </div>
  </div>`;
}

function setupHotelFilter() {
  document.getElementById("hotel-city-filter").addEventListener("change", filterHotels);
}

function filterHotels() {
  const city = document.getElementById("hotel-city-filter").value;
  const filtered = city ? hotels.filter(h => h.city === city) : hotels;
  renderHotelsPage(filtered);
}

function resetHotelFilter() {
  document.getElementById("hotel-city-filter").value = "";
  renderHotelsPage();
}

// ნომრების გვერდი
function openHotelRooms(hotelId) {
  currentHotelId = hotelId;
  const hotel = hotels.find(h => h.id === hotelId);
  document.getElementById("rooms-hotel-name").textContent = hotel ? hotel.name + " — ნომრები" : "ნომრები";

  // clear filters
  document.getElementById("room-type-filter").value  = "";
  document.getElementById("room-price-filter").value = "";
  document.getElementById("room-checkin").value       = "";
  document.getElementById("room-checkout").value      = "";

  renderRoomsPage();
  showPage("rooms");
}

function renderRoomsPage(filtered) {
  const hotel = hotels.find(h => h.id === currentHotelId);
  if (!hotel) return;

  const rooms = filtered !== undefined ? filtered : hotel.rooms;
  const grid  = document.getElementById("rooms-grid");

  if (!rooms || rooms.length === 0) {
    grid.innerHTML = `<div class="empty-state"><p>ნომერი ვერ მოიძებნა.</p></div>`;
    return;
  }

  grid.innerHTML = rooms.map(r => buildRoomCard(hotel, r, true)).join("");
}

function buildRoomCard(hotel, room, showBookBtn) {
  const imgHtml = room.image
    ? `<img src="${room.image}" alt="${room.name}" style="width:100%;height:100%;object-fit:cover;" />`
    : `<div class="card-img-placeholder" style="height:150px;"><span>ფოტო</span></div>`;

  const favIcon = room.favorite ? "★" : "☆";

  const amenitiesHtml = room.amenities
    ? `<div class="amenities">${room.amenities.map(a => `<span class="amenity-tag">${a}</span>`).join("")}</div>`
    : "";

  const bookBtn = showBookBtn
    ? `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openBookingModal(${room.id})">დაჯავშნა</button>`
    : `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openHotelRooms(${hotel.id});setTimeout(()=>openBookingModal(${room.id}),100)">დაჯავშნა</button>`;

  return `
  <div class="room-card">
    ${imgHtml}
    <div class="card-body">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div class="card-title">${room.name}</div>
        <button class="fav-btn" onclick="event.stopPropagation();toggleFavorite(${room.id})" title="ფავორიტი" id="fav-${room.id}">${favIcon}</button>
      </div>
      <div class="card-subtitle">${hotel.name} · ${hotel.city}</div>
      <div class="card-meta">
        <span class="badge">${room.type_label}</span>
        <span class="price-tag">${room.price} ₾ <span>/ ღამე</span></span>
      </div>
      ${amenitiesHtml}
    </div>
    <div class="room-card-footer">
      <span style="font-size:12px;color:var(--gray)">${room.capacity} სტუმარი</span>
      ${bookBtn}
    </div>
  </div>`;
}

function applyRoomFilter() {
  const hotel = hotels.find(h => h.id === currentHotelId);
  if (!hotel) return;

  const type     = document.getElementById("room-type-filter").value;
  const price    = document.getElementById("room-price-filter").value;
  const checkin  = document.getElementById("room-checkin").value;
  const checkout = document.getElementById("room-checkout").value;

  let rooms = [...hotel.rooms];

  if (type)  rooms = rooms.filter(r => r.type === type);

  if (price === "25-50")   rooms = rooms.filter(r => r.price >= 25 && r.price <= 50);
  if (price === "50-100")  rooms = rooms.filter(r => r.price > 50 && r.price <= 100);
  if (price === "100+")    rooms = rooms.filter(r => r.price > 100);

  // თუ არის თავისუფალი შემოწმება
  if (checkin && checkout) {
    if (checkin >= checkout) {
      showToast("შესვლის თარიღი უნდა იყოს გამოსვლამდე.");
      return;
    }
    rooms = rooms.filter(r => isRoomAvailable(r.id, checkin, checkout));
  }

  renderRoomsPage(rooms);
}

function resetRoomFilter() {
  document.getElementById("room-type-filter").value  = "";
  document.getElementById("room-price-filter").value = "";
  document.getElementById("room-checkin").value       = "";
  document.getElementById("room-checkout").value      = "";
  renderRoomsPage();
}

function goBack() {
  showPage("hotels");
}

// მოცემულ თარიღებში ოთახის ხელმისაწვდომობის შემოწმება არსებული ჯავშნების მიხედვით
function isRoomAvailable(roomId, checkin, checkout) {
  return !bookings.some(b => {
    if (b.room_id !== roomId) return false;
    if (b.status === "cancelled") return false;
    // ჯავშნის და მოთხოვნის თარიღები ემთხვევა თუ არა ერთმანეთს
    return b.checkin < checkout && b.checkout > checkin;
  });
}

// ფავორიტების დამატება/ამოღება
function toggleFavorite(roomId) {
  for (const h of hotels) {
    const room = (h.rooms || []).find(r => r.id === roomId);
    if (room) {
      room.favorite = !room.favorite;
      const btn = document.getElementById("fav-" + roomId);
      if (btn) btn.textContent = room.favorite ? "★" : "☆";
      showToast(room.favorite ? "ფავორიტებში დაემატა" : "ფავორიტებიდან ამოიღეს");
      return;
    }
  }
}

// ჯავშნის მოდალის გახსნა და დაკეტვა
function openBookingModal(roomId) {
  bookingRoomId = roomId;

  // მოვძებნოთ ოთახი და მისი სასტუმრო
  let room = null, hotel = null;
  for (const h of hotels) {
    const r = (h.rooms || []).find(r => r.id === roomId);
    if (r) { room = r; hotel = h; break; }
  }
  if (!room) return;

  document.getElementById("modal-room-info").innerHTML = `
    <strong>${room.name}</strong> — ${hotel.name}, ${hotel.city}<br/>
    <span style="color:var(--cantaloupe);font-weight:700">${room.price} ₾</span> / ღამე
  `;

  const ci = document.getElementById("room-checkin").value;
  const co = document.getElementById("room-checkout").value;
  document.getElementById("book-checkin").value  = ci || "";
  document.getElementById("book-checkout").value = co || "";
  document.getElementById("book-name").value    = "";
  document.getElementById("book-surname").value = "";
  document.getElementById("book-phone").value   = "";
  updatePricePreview(room.price);

  document.getElementById("booking-modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("booking-modal").classList.add("hidden");
  bookingRoomId = null;
}

function setupModalPricePreview() {
  ["book-checkin", "book-checkout"].forEach(id => {
    document.getElementById(id).addEventListener("change", () => {
      if (!bookingRoomId) return;
      let room = null;
      for (const h of hotels) {
        const r = (h.rooms || []).find(r => r.id === bookingRoomId);
        if (r) { room = r; break; }
      }
      if (room) updatePricePreview(room.price);
    });
  });
}

function updatePricePreview(pricePerNight) {
  const ci = document.getElementById("book-checkin").value;
  const co = document.getElementById("book-checkout").value;
  const el = document.getElementById("price-preview");
  if (ci && co && ci < co) {
    const nights = Math.round((new Date(co) - new Date(ci)) / 86400000);
    el.textContent = `${nights} ღამე × ${pricePerNight} ₾ = ${nights * pricePerNight} ₾ სულ`;
    el.style.color = "var(--cantaloupe-dark)";
    el.style.fontWeight = "600";
  } else {
    el.textContent = "";
  }
}

function submitBooking() {
  const name    = document.getElementById("book-name").value.trim();
  const surname = document.getElementById("book-surname").value.trim();
  const phone   = document.getElementById("book-phone").value.trim();
  const checkin = document.getElementById("book-checkin").value;
  const checkout= document.getElementById("book-checkout").value;

  if (!name || !surname || !phone || !checkin || !checkout) {
    showToast("გთხოვ შეავსო ყველა სავალდებულო ველი.");
    return;
  }
  if (checkin >= checkout) {
    showToast("შესვლის თარიღი უნდა იყოს გამოსვლამდე.");
    return;
  }
  if (!isRoomAvailable(bookingRoomId, checkin, checkout)) {
    showToast("ეს ნომერი მოცემულ თარიღებში დაჯავშნილია.");
    return;
  }

  let room = null, hotel = null;
  for (const h of hotels) {
    const r = (h.rooms || []).find(r => r.id === bookingRoomId);
    if (r) { room = r; hotel = h; break; }
  }

  const nights = Math.round((new Date(checkout) - new Date(checkin)) / 86400000);
  const total  = nights * room.price;

  const booking = {
    id:         Date.now(),
    hotel_id:   hotel.id,
    hotel_name: hotel.name,
    hotel_city: hotel.city,
    hotel_image:hotel.image,
    room_id:    room.id,
    room_name:  room.name,
    room_image: room.image,
    room_price: room.price,
    name, surname, phone,
    checkin, checkout,
    nights, total,
    status: "active",
    created_at: new Date().toISOString(),
  };

  bookings.push(booking);
  saveBookings();
  closeModal();
  showToast("ნომერი წარმატებით დაჯავშნა!");
}

// დაჯავშნული ნომრები (გვერდი)
function renderBookedPage(filtered) {
  const list = filtered !== undefined ? filtered : bookings;
  const tbody = document.getElementById("bookings-body");
  const empty = document.getElementById("bookings-empty");
  const table = document.querySelector(".bookings-table-wrap");

  if (list.length === 0) {
    tbody.innerHTML = "";
    empty.classList.remove("hidden");
    table.style.display = "none";
    return;
  }

  empty.classList.add("hidden");
  table.style.display = "";

  tbody.innerHTML = list.map(b => {
    const statusHtml = b.status === "cancelled"
      ? `<span class="status-badge status-cancelled">გაუქმებულია</span>`
      : `<span class="status-badge status-active">აქტიური</span>`;

    const cancelBtn = b.status !== "cancelled"
      ? `<button class="btn btn-danger btn-sm" onclick="cancelBooking(${b.id})">გაუქმება</button>`
      : `<span style="color:var(--gray);font-size:12px;">—</span>`;

    const hotelImg = b.hotel_image
      ? `<img src="${b.hotel_image}" class="mini-hotel-img" />`
      : `<div class="mini-hotel-img">ფოტო</div>`;

    const roomImg = b.room_image
      ? `<img src="${b.room_image}" class="mini-hotel-img" />`
      : `<div class="mini-hotel-img">ფოტო</div>`;

    return `
      <tr style="${b.status === 'cancelled' ? 'opacity:0.6' : ''}">
        <td>
          <div class="mini-hotel-info">
            ${hotelImg}
            <div>
              <div style="font-weight:600;font-size:13px;">${b.hotel_name}</div>
              <div style="font-size:12px;color:var(--gray);">${b.hotel_city}</div>
            </div>
          </div>
        </td>
        <td>
          <div class="mini-hotel-info">
            ${roomImg}
            <div>
              <div style="font-weight:600;font-size:13px;">${b.room_name}</div>
              <div style="font-size:12px;color:var(--gray);">${b.room_price} ₾/ღამე</div>
            </div>
          </div>
        </td>
        <td>${b.name} ${b.surname}</td>
        <td>${b.phone}</td>
        <td>${formatDate(b.checkin)}</td>
        <td>${formatDate(b.checkout)}</td>
        <td style="font-weight:700">${b.total} ₾</td>
        <td>${statusHtml}</td>
        <td>${cancelBtn}</td>
      </tr>`;
  }).join("");
}

function cancelBooking(bookingId) {
  const b = bookings.find(b => b.id === bookingId);
  if (!b) return;
  if (!confirm(`გაუქმება: ${b.room_name}, ${b.hotel_name}?`)) return;
  b.status = "cancelled";
  saveBookings();
  renderBookedPage(getFilteredBookings());
  showToast("ჯავშანი გაუქმდა.");
}

function setupBookedFilter() {
  document.getElementById("booked-city-filter").addEventListener("change", () => {
    renderBookedPage(getFilteredBookings());
  });
}

function getFilteredBookings() {
  const city = document.getElementById("booked-city-filter").value;
  return city ? bookings.filter(b => b.hotel_city === city) : bookings;
}

function resetBookedFilter() {
  document.getElementById("booked-city-filter").value = "";
  renderBookedPage();
}

// თარიღის ფორმატირება: YYYY-MM-DD - DD.MM.YYYY
function formatDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}`;
}

let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
}

// მოდალის დაკეტვა 
document.getElementById("booking-modal").addEventListener("click", e => {
  if (e.target === document.getElementById("booking-modal")) closeModal();
});