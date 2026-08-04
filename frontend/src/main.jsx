import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "semantic-ui-css/semantic.min.css";
import "/src/index.css";
import App from "/src/App.jsx";

createRoot(document.querySelector("#root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
