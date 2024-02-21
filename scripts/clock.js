//
// ======  Set up clock ========
//
const updateClock = () => {
    const clockElement = document.getElementById("clock");
    const day = document.getElementById("dayOfWeek");
    const dayOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const days = now.getDay();
    clockElement.innerText = timeString;
    day.innerHTML = dayOfWeek[days];
  }
  setInterval(updateClock, 1000);