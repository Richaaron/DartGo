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
      {/* ── Dynamic Header ────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-nebula-indigo-500/10 border border-nebula-indigo-500/20 text-nebula-indigo-400 text-[10px] font-black tracking-[0.3em] uppercase backdrop-blur-md">
            System Configuration
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">
            Digital <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-nebula-indigo-400 via-nebula-teal-400 to-nebula-pink-400">Governance.</span>
          </h1>
          <p className="text-nebula-slate-400 text-sm font-bold max-w-xl leading-relaxed tracking-tight">
            Calibrate the institutional parameters of the digital citadel.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-vibrant from-nebula-indigo-600 to-nebula-indigo-800 px-10 py-4 shadow-nebula"
        >
          <Save size={20} /> 
          {isSaving ? "Synchronizing..." : "Execute Updates"}
        </button>
      </div>

      {/* Save Message */}
      {message.text && (
        <div
          className={`p-6 rounded-3xl flex items-center gap-4 backdrop-blur-xl border ${
            message.type === "success"
              ? "bg-nebula-teal-500/10 text-nebula-teal-400 border-nebula-teal-500/20"
              : "bg-nebula-pink-500/10 text-nebula-pink-400 border-nebula-pink-500/20"
          }`}
        >
          <CheckCircle size={24} />
          <p className="font-bold tracking-tight">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Row 1: General Info */}
        <div className="nebula-card space-y-10">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <Globe size={24} className="text-nebula-indigo-400" /> General Logistics
            </h2>
            <p className="text-[10px] font-black text-nebula-slate-500 uppercase tracking-[0.2em]">Core institutional identifiers</p>
          </div>
          
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em] px-2">
                Institutional Name
              </label>
              <input
                type="text"
                className="input-nebula"
                value={config.schoolName || ""}
                onChange={(e) =>
                  setConfig({ ...config, schoolName: e.target.value })
                }
                placeholder="Folusho Victory Schools"
              />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em] px-2">
                  Active Term
                </label>
                <select
                  className="input-nebula !py-4"
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
                <label className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em] px-2">
                  Academic Cycle
                </label>
                <input
                  type="text"
                  className="input-nebula"
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
        <div className="nebula-card space-y-10">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <Palette size={24} className="text-nebula-teal-400" /> Visual Identity
            </h2>
            <p className="text-[10px] font-black text-nebula-slate-500 uppercase tracking-[0.2em]">Aesthetic parameters & emblems</p>
          </div>

          <div className="space-y-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em] px-2">
                Signature Aesthetic
              </label>
              <div className="flex gap-6 items-center bg-white/5 p-4 rounded-3xl border border-white/5">
                <input
                  type="color"
                  className="w-16 h-16 rounded-2xl cursor-pointer border-2 border-white/10 bg-transparent"
                  value={config.themeColor || "#2563eb"}
                  onChange={(e) =>
                    setConfig({ ...config, themeColor: e.target.value })
                  }
                />
                <code className="text-nebula-indigo-400 text-lg font-black tracking-widest font-mono">
                  {config.themeColor?.toUpperCase() || "#2563EB"}
                </code>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em] px-2">
                Institutional Motto
              </label>
              <input
                type="text"
                className="input-nebula"
                placeholder="Fountain of Knowledge"
                value={config.motto || ""}
                onChange={(e) =>
                  setConfig({ ...config, motto: e.target.value })
                }
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em] px-2">
                Institutional Emblem
              </label>
              <div className="flex items-center gap-8 bg-white/5 p-6 rounded-3xl border border-white/5">
                <div className="w-24 h-24 bg-nebula-slate-900 rounded-2xl flex items-center justify-center overflow-hidden border border-white/10 shadow-nebula">
                  <img
                    src={config.schoolLogo || "/school_logo.png?v=20260512"}
                    alt="School Logo"
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                <label className="btn-vibrant from-white/5 to-white/10 !text-white border border-white/10 !py-3 !px-6 text-xs cursor-pointer">
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
        <div className="nebula-card space-y-10">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <Users size={24} className="text-nebula-pink-400" /> Executive Command
            </h2>
            <p className="text-[10px] font-black text-nebula-slate-500 uppercase tracking-[0.2em]">Validated signatures for certification</p>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em] px-2">
                Lead Administrator / Principal
              </label>
              <input
                type="text"
                className="input-nebula"
                placeholder="Mr. James Adeyemi"
                value={config.principalName || ""}
                onChange={(e) =>
                  setConfig({ ...config, principalName: e.target.value })
                }
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em] px-2">
                Supreme Proprietress
              </label>
              <input
                type="text"
                className="input-nebula"
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
            <div className="p-8 bg-nebula-indigo-500/5 rounded-3xl border border-nebula-indigo-500/10">
              <p className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.4em] mb-10 text-center">Certification Validation Preview</p>
              <div className="grid grid-cols-2 gap-10">
                {config.principalName && (
                  <div className="text-center space-y-4">
                    <div className="h-px bg-gradient-to-r from-transparent via-nebula-indigo-500/40 to-transparent" />
                    <p className="text-sm font-black text-white uppercase tracking-tighter truncate px-4">
                      {config.principalName}
                    </p>
                    <p className="text-[10px] text-nebula-slate-500 font-black uppercase tracking-[0.2em]">
                      Principal
                    </p>
                  </div>
                )}
                {config.proprietressName && (
                  <div className="text-center space-y-4">
                    <div className="h-px bg-gradient-to-r from-transparent via-nebula-pink-500/40 to-transparent" />
                    <p className="text-sm font-black text-white uppercase tracking-tighter truncate px-4">
                      {config.proprietressName}
                    </p>
                    <p className="text-[10px] text-nebula-slate-500 font-black uppercase tracking-[0.2em]">
                      Proprietress
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div className="nebula-card space-y-10">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <MapPin size={24} className="text-nebula-teal-400" /> Sector Coordinates
            </h2>
            <p className="text-[10px] font-black text-nebula-slate-500 uppercase tracking-[0.2em]">Global positioning & communications</p>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em] px-2">
                Institutional Coordinates (Address)
              </label>
              <input
                type="text"
                className="input-nebula"
                placeholder="12 Victory Close, Ibadan, Nigeria"
                value={config.schoolAddress || ""}
                onChange={(e) =>
                  setConfig({ ...config, schoolAddress: e.target.value })
                }
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em] px-2">
                Comm-Link Frequency (Phone)
              </label>
              <input
                type="text"
                className="input-nebula"
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
  );
}
