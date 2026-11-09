import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Collections from "./pages/Collections";
import CollectionDetail from "./pages/CollectionDetail";
import ProjectDetail from "./pages/ProjectDetail";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCollections from "./pages/AdminCollections";
import AdminProjects from "./pages/AdminProjects";
import AdminEvents from "./pages/AdminEvents";
import AdminApplicants from "./pages/AdminApplicants";
import AdminMessages from "./pages/AdminMessages";
import AdminProfile from "./pages/AdminProfile";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/collections/:slug" element={<CollectionDetail />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:slug" element={<EventDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/collections" element={<AdminCollections />} />
          <Route path="/admin/projects" element={<AdminProjects />} />
          <Route path="/admin/events" element={<AdminEvents />} />
          <Route path="/admin/events/:id/applicants" element={<AdminApplicants />} />
          <Route path="/admin/messages" element={<AdminMessages />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
        </Route>
      </Route>
    </Routes>
  );
}