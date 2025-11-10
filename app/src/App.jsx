// app/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Nav from "./components/Nav.jsx";

import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ProjectsProvider } from "./context/ProjectsContext.jsx";

import Home from "./pages/Home.jsx";
import Projects from "./pages/Projects.jsx";
import Project from "./pages/Project.jsx";
import ProjectCreate from "./pages/ProjectCreate.jsx";
import ProjectEdit from "./pages/ProjectEdit.jsx";
import TaskCreate from "./pages/TaskCreate.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import UsersAdmin from "./pages/UsersAdmin.jsx";

function hasAccessToken() {
  return Boolean(localStorage.getItem("access_token"));
}

function ProtectedRoute({ children }) {
  const loc = useLocation();
  if (!hasAccessToken()) return <Navigate to="/login" replace state={{ from: loc }} />;
  return children;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <ProjectsProvider>
        <BrowserRouter>
          <Nav />
          <main style={{ padding: "16px" }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/profile"
                element={<ProtectedRoute><UserProfile /></ProtectedRoute>}
              />

              <Route
                path="/projects"
                element={<ProtectedRoute><Projects /></ProtectedRoute>}
              />
              <Route
                path="/projects/new"
                element={<ProtectedRoute><ProjectCreate /></ProtectedRoute>}
              />
              <Route
                path="/projects/:id"
                element={<ProtectedRoute><Project /></ProtectedRoute>}
              />
              <Route
                path="/projects/:id/edit"
                element={<ProtectedRoute><ProjectEdit /></ProtectedRoute>}
              />
              <Route
                path="/projects/:id/new-task"
                element={<ProtectedRoute><TaskCreate /></ProtectedRoute>}
              />
              <Route
                path="/projects/:id/edit-task/:taskId"
                element={<ProtectedRoute><TaskCreate /></ProtectedRoute>}
              />

              {/* Админский раздел */}
              <Route
                path="/admin/users"
                element={<ProtectedRoute><AdminRoute><UsersAdmin /></AdminRoute></ProtectedRoute>}
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </BrowserRouter>
      </ProjectsProvider>
    </AuthProvider>
  );
}
