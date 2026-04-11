import { Routes, Route } from "react-router-dom";
import Scoreboard from "./features/scoreboard/Scoreboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Scoreboard />} />
    </Routes>
  );
}
