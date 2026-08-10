import { Routes, Route } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import Home from "../pages/Home";
import Documents from "../pages/Documents";
import Editor from "../pages/Editor";

function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/editor/:id" element={<Editor />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;