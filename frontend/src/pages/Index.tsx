import { Navigate } from "react-router-dom";
import Landing from "./Landing";

const Index = () => {
  const isLoggedIn = localStorage.getItem("is_logged_in") === "true";
  if (isLoggedIn) return <Navigate to="/dashboard" replace />;
  return <Landing />;
};
export default Index;
