import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { initKeycloak } from "./lib/keycloak";

initKeycloak().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});