//
// ======  Set up clock ========
//
const dayOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const updateClock = () => {
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const dayEl = document.getElementById("dayOfWeek");

  const now = new Date();

  hoursEl.textContent = now.getHours().toString().padStart(2, "0");
  minutesEl.textContent = now.getMinutes().toString().padStart(2, "0");
  dayEl.textContent = dayOfWeek[now.getDay()];
};

updateClock();
setInterval(updateClock, 1000);