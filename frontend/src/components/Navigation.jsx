import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../Redux/authSlice";
import LogoMark from "./LogoMark";

const Navigation = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth.user);
  const user = {
    id: authUser?.id || null,
    name: authUser?.name || "Signed-in user",
    email: authUser?.email || "No email shared",
    picture: authUser?.picture || "",
  };

  const initials = useMemo(
    () =>
      user.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase(),
    [user.name],
  );

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-[#211F2E] bg-[#0B0A12]/90 px-8 py-3.5 backdrop-blur-sm">
      <div className="flex items-center gap-2.5">
        <LogoMark size={48} />
        <h1 className="font-display text-[17px] font-semibold tracking-tight text-[#F3F1F7]">
          Chat Application
        </h1>
      </div>

      <section className="flex items-center gap-4" aria-label="Signed in user">
        <div className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3.5 transition-colors hover:bg-[#1B1830]">
          <span className="relative inline-flex">
            {user.picture ? (
              <img
                className="h-9 w-9 rounded-full object-cover ring-2 ring-[#0B0A12]"
                src={user.picture}
                alt=""
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6C63FF] text-xs font-semibold text-white ring-2 ring-[#0B0A12]">
                {initials || "U"}
              </span>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0B0A12]" />
          </span>

          <div className="flex flex-col leading-tight">
            <p className="font-body text-sm font-semibold text-[#F3F1F7]">
              {user.name}
            </p>
            <p className="font-body text-[13px] tracking-wide text-[#96939F]">
              {user.email}
            </p>
          </div>
        </div>

        <span className="h-6 w-px bg-[#211F2E]" aria-hidden="true" />

        <button
          type="button"
          onClick={handleLogout}
          className="font-body text-sm font-medium text-[#96939F] transition-colors hover:text-[#F3F1F7]"
        >
          Sign Out
        </button>
      </section>
    </header>
  );
};

export default Navigation;
