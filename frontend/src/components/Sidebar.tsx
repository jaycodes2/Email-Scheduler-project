import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock3, Send, ChevronDown, LogOut } from "lucide-react";
import type { EmailFolder, User } from "../types";

interface SidebarProps {
  user: User;
  activeFolder: EmailFolder;
  onFolderChange: (folder: EmailFolder) => void;
  scheduledCount: number;
  sentCount: number;
  onLogout: () => void;
}

export default function Sidebar({
  user,
  activeFolder,
  onFolderChange,
  scheduledCount,
  sentCount,
  onLogout,
}: SidebarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <aside className="w-60 shrink-0 bg-white text-gray-900 border-r border-gray-100 flex flex-col px-4 py-5">
      <div className="text-2xl font-black tracking-tight mb-6 px-1 select-none">
        ONB
      </div>

      <div className="relative mb-4" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="w-full flex items-center gap-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors px-2.5 py-2 text-left"
        >
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-8 w-8 rounded-full object-cover shrink-0"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium leading-tight truncate">
              {user.name}
            </span>
            <span className="block text-xs text-gray-500 leading-tight truncate">
              {user.email}
            </span>
          </span>
          <ChevronDown
            size={16}
            className={`text-gray-400 shrink-0 transition-transform ${
              menuOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {menuOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 rounded-lg bg-[#1a1a1a] border border-white/10 shadow-lg overflow-hidden z-10">
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate("/compose")}
        className="w-full rounded-full border border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 transition-colors py-2 text-sm font-medium mb-6"
      >
        Compose
      </button>

      <div className="text-[10px] font-semibold tracking-wider text-white/35 px-1 mb-2">
        CORE
      </div>

      <nav className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => onFolderChange("scheduled")}
          className={`w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
            activeFolder === "scheduled"
              ? "bg-emerald-500/15 text-gray-900 font-medium"
              : "text-gray-900 hover:bg-gray-100"
          }`}
        >
          <Clock3 size={15} />
          <span className="flex-1 text-left">Scheduled</span>
          <span className="text-xs text-gray-900">{scheduledCount}</span>
        </button>

        <button
          type="button"
          onClick={() => onFolderChange("sent")}
          className={`w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
            activeFolder === "sent"
              ? "bg-emerald-500/15 text-gray-900 font-medium"
              : "text-gray-900 hover:bg-gray-100"
          }`}
        >
          <Send size={15} />
          <span className="flex-1 text-left">Sent</span>
          <span className="text-xs text-gray-900">{sentCount}</span>
        </button>
      </nav>
    </aside>
  );
}