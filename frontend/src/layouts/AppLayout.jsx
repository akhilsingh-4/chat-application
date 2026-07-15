import { Outlet } from "react-router-dom";
import Navigation from "../components/Navigation";

const AppLayout = () => {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0B0A12]">
      <Navigation />
      <Outlet />
    </div>
  );
};

export default AppLayout;
