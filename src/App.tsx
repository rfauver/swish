import { Routes, Route } from "react-router-dom";
import Scoreboard from "./features/scoreboard/Scoreboard";
import GamePage from "./features/game/GamePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Scoreboard />} />
      <Route path="/game/:eventId" element={<GamePage />} />
    </Routes>
  );
}
