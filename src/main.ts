import "./style.css";

// The analysis graph is a dev tool; players get the ride.
const debug = new URLSearchParams(location.search).has("debug");
document.documentElement.classList.toggle("debug", debug);
await (debug ? import("./debug") : import("./game"));
