import { useState, useEffect } from "react";

export function useClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const greeting = (() => {
    if (hours < 5) return "Good Night";
    if (hours < 12) return "Good Morning";
    if (hours < 17) return "Good Afternoon";
    if (hours < 21) return "Good Evening";
    return "Good Night";
  })();

  return {
    time24: `${hours.toString().padStart(2, "0")}:${minutes}`,
    time12: `${h12}:${minutes}`,
    seconds,
    ampm,
    date: `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`,
    greeting,
    dateShort: `${months[now.getMonth()].slice(0, 3)} ${now.getDate()}`,
  };
}
