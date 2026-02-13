import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SchedulerPage from "@/pages/SchedulerPage";
import { Toaster } from "sonner";

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SchedulerPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
