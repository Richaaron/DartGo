import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import {
  Save,
  Palette,
  Globe,
  Image as ImageIcon,
  CheckCircle,
  Users,
  MapPin,
} from "lucide-react";
import { fetchConfig, updateConfig } from "../services/api";

export default function Settings() {
  const [config, setConfig] = useState<any>({
    schoolName: "",
    currentTerm: "",
    currentAcademicYear: "",
    themeColor: "#2563eb",
    schoolLogo: "",
    availableClasses: [],
    principalName: "",
    proprietressName: "",
    schoolAddress: "",
    schoolPhone: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await fetchConfig();
        setConfig((prev: any) => ({ ...prev, ...data }));
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("Failed to load config", error);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateConfig(config);
      setMessage({ type: "success", text: "Settings updated successfully!" });
      window.setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      document.documentElement.style.setProperty(
        "--primary-color",
        config.themeColor,
      );
    } catch {
      setMessage({ type: "error", text: "Failed to update settings" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (e: ChangeEvent<any>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new window.FileReader();
    reader.onloadend = () => {
      setConfig({ ...config, schoolLogo: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  if (isLoading)
    return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="space-y-12">
    <div className="space-y-12">
      {/* ── Dynamic Header ────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black tracking-[0.35em] uppercase">
            System Configuration
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">
            Settings & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-500">Preferences.</span>
          </h1>
          <p className="text-slate-500 text-sm font-bold max-w-xl leading-relaxed tracking-tight">
            Configure the institutional parameters of the school.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
        >
          <Save size={20} /> 
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Save Message */}
      {message.text && (
        <div
          className={`p-6 rounded-2xl flex items-center gap-5 border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
              : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
          }`}
        >
          <CheckCircle size={24} />
          <p className="font-bold tracking-tight">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Row 1: General Info */}
        <div className="bg-white dark:bg-slate-900 space-y-12 p-8 md:p-12 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg">
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-4">
              <Globe size={28} className="text-indigo-600 dark:text-indigo-400" /> General Details
            </h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Core institutional identifiers</p>
          </div>
          
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.45em] px-2">
                School Name
              </label>
              <input
                type="text"
                className="input !py-5 !bg-slate-50 dark:!bg-slate-950/50"
                value={config.schoolName || ""}
                onChange={(e) =>
                  setConfig({ ...config, schoolName: e.target.value })
                }
                placeholder="School Name"
              />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.45em] px-2">
                  Active Term
                </label>
                <select
                  className="input !py-5 !bg-slate-50 dark:!bg-slate-950/50"
                  value={config.currentTerm || ""}
                  onChange={(e) =>
                    setConfig({ ...config, currentTerm: e.target.value })
                  }
                >
                  <option value="1st Term">1st Term</option>
                  <option value="2nd Term">2nd Term</option>
                  <option value="3rd Term">3rd Term</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.45em] px-2">
                  Academic Year
                </label>
                <input
                  type="text"
                  className="input !py-5 !bg-slate-50 dark:!bg-slate-950/50"
                  placeholder="2024/2025"
                  value={config.currentAcademicYear || ""}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      currentAcademicYear: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white dark:bg-slate-900 space-y-12 p-8 md:p-12 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg">
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-4">
              <Palette size={28} className="text-indigo-600 dark:text-indigo-400" /> Branding
            </h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Aesthetic parameters & emblems</p>
          </div>

          <div className="space-y-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.45em] px-2">
                Theme Color
              </label>
              <div className="flex gap-8 items-center bg-slate-50 dark:bg-slate-950/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <input
                  type="color"
                  className="w-20 h-20 rounded-2xl cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent"
                  value={config.themeColor || "#2563eb"}
                  onChange={(e) =>
                    setConfig({ ...config, themeColor: e.target.value })
                  }
                />
                <code className="text-slate-900 dark:text-white text-xl font-black tracking-widest font-mono">
                  {config.themeColor?.toUpperCase() || "#2563EB"}
                </code>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.45em] px-2">
                School Motto
              </label>
              <input
                type="text"
                className="input !py-5 !bg-slate-50 dark:!bg-slate-950/50"
                placeholder="Fountain of Knowledge"
                value={config.motto || ""}
                onChange={(e) =>
                  setConfig({ ...config, motto: e.target.value })
                }
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.45em] px-2">
                School Logo
              </label>
              <div className="flex items-center gap-10 bg-slate-50 dark:bg-slate-950/50 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                  <img
                    src={config.schoolLogo || "/school_logo.png?v=20260512"}
                    alt="School Logo"
                    className="w-full h-full object-contain p-3"
                  />
                </div>
                <label className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:border-indigo-500 cursor-pointer shadow-sm transition-all">
                  Update Emblem
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* School Officials */}
        <div className="bg-white dark:bg-slate-900 space-y-12 p-8 md:p-12 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg">
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-4">
              <Users size={28} className="text-indigo-600 dark:text-indigo-400" /> School Officials
            </h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Validated signatures for reports</p>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.45em] px-2">
                Principal
              </label>
              <input
                type="text"
                className="input !py-5 !bg-slate-50 dark:!bg-slate-950/50"
                placeholder="Mr. James Adeyemi"
                value={config.principalName || ""}
                onChange={(e) =>
                  setConfig({ ...config, principalName: e.target.value })
                }
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.45em] px-2">
                Proprietress
              </label>
              <input
                type="text"
                className="input !py-5 !bg-slate-50 dark:!bg-slate-950/50"
                placeholder="Mrs. Folusho Adekunle"
                value={config.proprietressName || ""}
                onChange={(e) =>
                  setConfig({ ...config, proprietressName: e.target.value })
                }
              />
            </div>
          </div>

          {/* Signature Preview */}
          {(config.principalName || config.proprietressName) && (
            <div className="p-10 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.45em] mb-12 text-center">Signature Preview</p>
              <div className="grid grid-cols-2 gap-12">
                {config.principalName && (
                  <div className="text-center space-y-5">
                    <div className="h-px bg-slate-200 dark:bg-slate-800" />
                    <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate px-4">
                      {config.principalName}
                    </p>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.25em]">
                      Principal
                    </p>
                  </div>
                )}
                {config.proprietressName && (
                  <div className="text-center space-y-5">
                    <div className="h-px bg-slate-200 dark:bg-slate-800" />
                    <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate px-4">
                      {config.proprietressName}
                    </p>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.25em]">
                      Proprietress
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div className="bg-white dark:bg-slate-900 space-y-12 p-8 md:p-12 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg">
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-4">
              <MapPin size={28} className="text-indigo-600 dark:text-indigo-400" /> Contact Info
            </h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Address and phone details</p>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.45em] px-2">
                School Address
              </label>
              <input
                type="text"
                className="input !py-5 !bg-slate-50 dark:!bg-slate-950/50"
                placeholder="12 Victory Close, Ibadan, Nigeria"
                value={config.schoolAddress || ""}
                onChange={(e) =>
                  setConfig({ ...config, schoolAddress: e.target.value })
                }
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.45em] px-2">
                School Phone
              </label>
              <input
                type="text"
                className="input !py-5 !bg-slate-50 dark:!bg-slate-950/50"
                placeholder="+234 801 234 5678"
                value={config.schoolPhone || ""}
                onChange={(e) =>
                  setConfig({ ...config, schoolPhone: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
