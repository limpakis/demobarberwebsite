const year = document.getElementById("year");
const navLinks = Array.from(document.querySelectorAll(".nav-links a"));
const pageShell = document.querySelector(".page-shell");
const isBookPage = document.body.classList.contains("page-book");
const isThankYouPage = document.body.classList.contains("page-thank-you");

if (year) {
  year.textContent = new Date().getFullYear();
}

if (pageShell) {
  requestAnimationFrame(() => {
    pageShell.classList.add("is-loaded");
  });
}

if (isBookPage && window.location.hash === "#booking-start") {
  window.requestAnimationFrame(() => {
    const target = document.getElementById("booking-start");
    const header = document.querySelector(".site-header");
    if (!target) {
      return;
    }
    const offset = (header?.offsetHeight || 0) + 64;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "auto" });
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

document.querySelectorAll(".reveal").forEach((element) => {
  revealObserver.observe(element);
});

const currentPage = window.location.pathname.split("/").pop() || "index.html";
navLinks.forEach((link) => {
  const href = link.getAttribute("href");
  if (href === currentPage) {
    link.classList.add("active");
  }
});

document.querySelectorAll('a[href$=".html"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");
    const isNewTab = link.target === "_blank";
    const isSamePage = href === currentPage;
    if (!href || isNewTab || isSamePage || href.startsWith("http")) {
      return;
    }
    event.preventDefault();
    if (pageShell) {
      pageShell.classList.add("is-leaving");
      window.setTimeout(() => {
        window.location.href = href;
      }, 180);
      return;
    }
    window.location.href = href;
  });
});

const magneticCards = document.querySelectorAll(".magnetic-card");
magneticCards.forEach((card) => {
  card.addEventListener("mousemove", (event) => {
    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    card.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateZ(0)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});

if (isThankYouPage) {
  const params = new URLSearchParams(window.location.search);
  const name = params.get("name") || "client";
  const service = params.get("service") || "-";
  const date = params.get("date") || "-";
  const time = params.get("time") || "-";

  const thankYouName = document.getElementById("thankYouName");
  const thankYouService = document.getElementById("thankYouService");
  const thankYouDate = document.getElementById("thankYouDate");
  const thankYouTime = document.getElementById("thankYouTime");

  if (thankYouName) {
    thankYouName.textContent = name;
  }
  if (thankYouService) {
    thankYouService.textContent = service;
  }
  if (thankYouDate) {
    thankYouDate.textContent = date;
  }
  if (thankYouTime) {
    thankYouTime.textContent = time;
  }
}

if (isBookPage) {
  const STORAGE_KEY = "topboy-appointments";
  const services = [
    { id: "skin-fade", name: "Skin Fade", duration: 45, price: 20 },
    { id: "haircut-beard", name: "Haircut + Beard", duration: 60, price: 30 },
    { id: "beard-sculpt", name: "Beard Sculpt", duration: 30, price: 15 },
    { id: "vip-package", name: "VIP Package", duration: 75, price: 45 },
  ];

  const state = {
    step: 1,
    service: null,
    date: "",
    time: "",
    name: "",
    phone: "",
    notes: "",
    currentMonth: null,
  };

  const serviceOptions = document.getElementById("serviceOptions");
  const slotGrid = document.getElementById("slotGrid");
  const summary = document.getElementById("bookingSummary");
  const bookingMessage = document.getElementById("bookingMessage");
  const upcomingList = document.getElementById("upcomingList");
  const calendarGrid = document.getElementById("calendarGrid");
  const calendarWrap = document.getElementById("calendarWrap");
  const calendarMonthLabel = document.getElementById("calendarMonthLabel");
  const prevMonth = document.getElementById("prevMonth");
  const nextMonth = document.getElementById("nextMonth");
  const selectedDateLabel = document.getElementById("selectedDateLabel");
  const timeOverlay = document.getElementById("timeOverlay");
  const timeOverlayBackdrop = document.getElementById("timeOverlayBackdrop");
  const closeTimeOverlay = document.getElementById("closeTimeOverlay");
  const overlayTitle = document.getElementById("overlayTitle");
  let selectedDayButton = null;

  const controls = {
    toStep3: document.getElementById("toStep3"),
    toStep4: document.getElementById("toStep4"),
    backTo1: document.getElementById("backTo1"),
    backTo2: document.getElementById("backTo2"),
    backTo3: document.getElementById("backTo3"),
    confirm: document.getElementById("confirmBooking"),
  };

  const inputs = {
    name: document.getElementById("customerName"),
    phone: document.getElementById("customerPhone"),
    notes: document.getElementById("customerNotes"),
  };

  const today = new Date();
  const todayAtMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  state.currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const getAppointments = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  };

  const saveAppointments = (appointments) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
  };

  const formatDate = (value) => {
    const date = new Date(`${value}T00:00:00`);
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const renderServices = () => {
    serviceOptions.innerHTML = "";
    services.forEach((service) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "service-option";
      button.innerHTML = `<strong>${service.name}</strong><span>${service.duration} min · €${service.price}</span>`;
      if (state.service?.id === service.id) {
        button.classList.add("selected");
      }
      button.addEventListener("click", () => {
        state.service = service;
        renderServices();
        showStep(2);
      });
      serviceOptions.appendChild(button);
    });
  };

  const makeSlots = () => {
    const times = [];
    for (let hour = 10; hour <= 20; hour += 1) {
      times.push(`${String(hour).padStart(2, "0")}:00`);
      times.push(`${String(hour).padStart(2, "0")}:30`);
    }
    return times;
  };

  const renderSlots = () => {
    slotGrid.innerHTML = "";

    if (!state.date) {
      validateStep2();
      return;
    }

    const slots = makeSlots();
    const appointments = getAppointments();
    let availableCount = 0;
    const now = new Date();

    slots.forEach((time) => {
      const slotDateTime = new Date(`${state.date}T${time}:00`);
      const isPastTime = slotDateTime <= now;

      const taken = appointments.some((item) => {
        if (item.date !== state.date || item.time !== time) {
          return false;
        }
        return true;
      });

      const button = document.createElement("button");
      button.type = "button";
      button.className = "slot-btn";
      button.textContent = time;

      if (taken || isPastTime) {
        button.disabled = true;
        button.classList.add("taken");
      } else {
        availableCount += 1;
      }

      if (state.time === time) {
        button.classList.add("selected");
      }

      button.addEventListener("click", () => {
        state.time = time;
        renderSlots();
        validateStep2();
        closeOverlay();
        window.setTimeout(() => {
          showStep(3);
        }, 220);
      });

      slotGrid.appendChild(button);
    });

    if (!availableCount) {
      const empty = document.createElement("p");
      empty.className = "form-message";
      empty.textContent = "No free slots for this date. Try another date.";
      slotGrid.appendChild(empty);
    }
  };

  const showStep = (step) => {
    state.step = step;
    document.querySelectorAll(".booking-step").forEach((panel) => {
      panel.classList.toggle("active", Number(panel.dataset.step) === step);
    });
    document.querySelectorAll(".step-dot").forEach((dot) => {
      const dotStep = Number(dot.dataset.stepDot);
      dot.classList.toggle("active", dotStep === step);
      dot.classList.toggle("done", dotStep < step);
    });
  };

  const validateStep2 = () => {
    const valid = Boolean(state.date && state.time);
    controls.toStep3.disabled = !valid;
  };

  const getSelectedDayButton = () =>
    selectedDayButton || calendarGrid?.querySelector(".calendar-cell.selected:not(.empty)");

  const openOverlay = (triggerButton) => {
    if (!timeOverlay) {
      return;
    }

    const calendarRect = calendarWrap?.getBoundingClientRect();
    const sidePadding = 16;
    const panelWidth = Math.min(760, window.innerWidth * 0.92);
    const panelHeight = Math.min(420, window.innerHeight * 0.56);

    const leftShift = 200;
    const upShift = 78;

    const targetCenterX = calendarRect
      ? calendarRect.left + calendarRect.width / 2
      : window.innerWidth / 2;
    const targetCenterY = calendarRect
      ? calendarRect.top + calendarRect.height / 2
      : window.innerHeight / 2;

    const desiredTop = targetCenterY - panelHeight / 2 - 16 - upShift;
    const clampedLeft = Math.max(
      sidePadding,
      Math.min(targetCenterX - panelWidth / 2 - leftShift, window.innerWidth - panelWidth - sidePadding)
    );
    const clampedTop = Math.max(
      28,
      Math.min(desiredTop, window.innerHeight - panelHeight - 28)
    );

    timeOverlay.style.setProperty("--panel-left", `${clampedLeft}px`);
    timeOverlay.style.setProperty("--panel-top", `${clampedTop}px`);

    if (triggerButton) {
      const rect = triggerButton.getBoundingClientRect();
      const originX = rect.left + rect.width / 2 - clampedLeft;
      const originY = Math.max(8, rect.top + rect.height / 2 - clampedTop);
      timeOverlay.style.setProperty("--panel-origin-x", `${originX}px`);
      timeOverlay.style.setProperty("--panel-origin-y", `${originY}px`);
    } else {
      timeOverlay.style.setProperty("--panel-origin-x", "50%");
      timeOverlay.style.setProperty("--panel-origin-y", "40%");
    }

    timeOverlay.classList.remove("is-open");
    timeOverlay.classList.remove("is-hidden");
    timeOverlay.setAttribute("aria-hidden", "false");

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        timeOverlay.classList.add("is-open");
      });
    });
  };

  const closeOverlay = () => {
    if (!timeOverlay) {
      return;
    }
    timeOverlay.classList.remove("is-open");
    timeOverlay.setAttribute("aria-hidden", "true");
    window.setTimeout(() => {
      if (!timeOverlay.classList.contains("is-open")) {
        timeOverlay.classList.add("is-hidden");
      }
    }, 360);
  };

  const toIsoDate = (year, month, day) => {
    const date = new Date(year, month, day);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const renderCalendar = () => {
    const year = state.currentMonth.getFullYear();
    const month = state.currentMonth.getMonth();
    const monthName = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(
      state.currentMonth
    );

    calendarMonthLabel.textContent = monthName;
    calendarGrid.innerHTML = "";
    selectedDayButton = null;

    const firstDayJs = new Date(year, month, 1).getDay();
    const firstDayMondayBased = (firstDayJs + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayMondayBased; i += 1) {
      const spacer = document.createElement("div");
      spacer.className = "calendar-cell empty";
      calendarGrid.appendChild(spacer);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const iso = toIsoDate(year, month, day);
      const cellDate = new Date(year, month, day);
      const isPast = cellDate < todayAtMidnight;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "calendar-cell";
      button.textContent = String(day);

      if (iso === state.date) {
        button.classList.add("selected");
        selectedDayButton = button;
      }

      if (isPast) {
        button.disabled = true;
        button.classList.add("past");
      }

      button.addEventListener("click", () => {
        state.date = iso;
        state.time = "";
        selectedDateLabel.textContent = `Selected: ${formatDate(iso)}`;
        if (overlayTitle) {
          overlayTitle.textContent = `Available times · ${formatDate(iso)}`;
        }
        renderCalendar();
        renderSlots();
        validateStep2();
        openOverlay(getSelectedDayButton() || button);
      });

      calendarGrid.appendChild(button);
    }

    const isCurrentMonthView = year === today.getFullYear() && month === today.getMonth();
    prevMonth.disabled = isCurrentMonthView;
  };

  const renderSummary = () => {
    if (!state.service) {
      return;
    }
    summary.innerHTML = `
      <p><strong>Service:</strong> ${state.service.name} (€${state.service.price})</p>
      <p><strong>Duration:</strong> ${state.service.duration} min</p>
      <p><strong>Date & Time:</strong> ${formatDate(state.date)} at ${state.time}</p>
      <p><strong>Name:</strong> ${state.name}</p>
      <p><strong>Phone:</strong> ${state.phone}</p>
      <p><strong>Notes:</strong> ${state.notes || "-"}</p>
    `;
  };

  const renderUpcoming = () => {
    const appointments = getAppointments()
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
      .slice(0, 6);
    upcomingList.innerHTML = "";

    if (!appointments.length) {
      const empty = document.createElement("li");
      empty.textContent = "No appointments yet.";
      upcomingList.appendChild(empty);
      return;
    }

    appointments.forEach((appointment) => {
      const item = document.createElement("li");
      item.innerHTML = `<strong>${appointment.service}</strong> · ${formatDate(appointment.date)} at ${appointment.time}<br/><span>${appointment.name}</span>`;
      upcomingList.appendChild(item);
    });
  };

  controls.toStep3.addEventListener("click", () => showStep(3));
  controls.toStep4.addEventListener("click", () => {
    state.name = inputs.name.value.trim();
    state.phone = inputs.phone.value.trim();
    state.notes = inputs.notes.value.trim();

    if (!state.name || !state.phone) {
      bookingMessage.textContent = "Please add your name and phone.";
      return;
    }

    bookingMessage.textContent = "";
    renderSummary();
    showStep(4);
  });

  controls.backTo1.addEventListener("click", () => showStep(1));
  controls.backTo2.addEventListener("click", () => showStep(2));
  controls.backTo3.addEventListener("click", () => showStep(3));

  prevMonth.addEventListener("click", () => {
    const view = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1, 1);
    if (view < new Date(today.getFullYear(), today.getMonth(), 1)) {
      return;
    }
    state.currentMonth = view;
    renderCalendar();
  });

  nextMonth.addEventListener("click", () => {
    state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  closeTimeOverlay?.addEventListener("click", closeOverlay);
  timeOverlayBackdrop?.addEventListener("click", closeOverlay);

  controls.confirm.addEventListener("click", () => {
    const appointment = {
      id: crypto.randomUUID(),
      service: state.service.name,
      duration: state.service.duration,
      price: state.service.price,
      date: state.date,
      time: state.time,
      name: state.name,
      phone: state.phone,
      notes: state.notes,
    };

    const appointments = getAppointments();
    const conflict = appointments.some((item) => item.date === appointment.date && item.time === appointment.time);

    if (conflict) {
      bookingMessage.textContent = "That time was just booked. Please pick another slot.";
      showStep(2);
      renderSlots();
      return;
    }

    appointments.push(appointment);
    saveAppointments(appointments);
    const thankYouParams = new URLSearchParams({
      name: appointment.name,
      service: appointment.service,
      date: formatDate(appointment.date),
      time: appointment.time,
    });

    window.location.href = `thank-you.html?${thankYouParams.toString()}`;
  });

  renderServices();
  renderCalendar();
  validateStep2();
  renderUpcoming();
}
