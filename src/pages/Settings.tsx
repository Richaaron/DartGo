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
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-folusho-sage-50 border border-folusho-sage-100 text-folusho-sage-500 text-[10px] font-black tracking-[0.35em] uppercase">
            System Configuration
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-folusho-slate-900 tracking-tighter leading-none">
            Digital <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-folusho-sage-500 via-folusho-coral-400 to-folusho-sage-600">Governance.</span>
          </h1>
          <p className="text-folusho-slate-400 text-base font-bold max-w-xl leading-relaxed tracking-tight">
            Calibrate the institutional parameters of the Folusho academic citadel.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-vibrant bg-folusho-sage-400 shadow-folusho"
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
              ? "bg-folusho-sage-50 text-folusho-sage-600 border-folusho-sage-100"
              : "bg-folusho-coral-50 text-folusho-coral-500 border-folusho-coral-100"
          }`}
        >
          <CheckCircle size={24} />
          <p className="font-bold tracking-tight">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Row 1: General Info */}
        <div className="folusho-card space-y-12 !p-12 border-folusho-cream-200">
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-folusho-slate-900 uppercase tracking-tighter flex items-center gap-4">
              <Globe size={28} className="text-folusho-sage-500" /> General Logistics
            </h2>
            <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.25em]">Core institutional identifiers</p>
          </div>
          
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.45em] px-2">
                Institutional Name
              </label>
              <input
                type="text"
                className="input-folusho !py-5"
                value={config.schoolName || ""}
                onChange={(e) =>
                  setConfig({ ...config, schoolName: e.target.value })
                }
                placeholder="Folusho Victory Schools"
              />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.45em] px-2">
                  Active Term
                </label>
                <select
                  className="input-folusho !py-5"
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
                <label className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.45em] px-2">
                  Academic Cycle
                </label>
                <input
                  type="text"
                  className="input-folusho !py-5"
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
        <div className="folusho-card space-y-12 !p-12 border-folusho-cream-200">
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-folusho-slate-900 uppercase tracking-tighter flex items-center gap-4">
              <Palette size={28} className="text-folusho-yellow-600" /> Visual Identity
            </h2>
            <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.25em]">Aesthetic parameters & emblems</p>
          </div>

          <div className="space-y-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.45em] px-2">
                Signature Aesthetic
              </label>
              <div className="flex gap-8 items-center bg-folusho-cream-50 p-6 rounded-[2rem] border border-folusho-cream-100 shadow-inner">
                <input
                  type="color"
                  className="w-20 h-20 rounded-2xl cursor-pointer border-2 border-white bg-transparent shadow-folusho"
                  value={config.themeColor || "#2563eb"}
                  onChange={(e) =>
                    setConfig({ ...config, themeColor: e.target.value })
                  }
                />
                <code className="text-folusho-slate-900 text-xl font-black tracking-widest font-mono">
                  {config.themeColor?.toUpperCase() || "#2563EB"}
                </code>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.45em] px-2">
                Institutional Motto
              </label>
              <input
                type="text"
                className="input-folusho !py-5"
                placeholder="Fountain of Knowledge"
                value={config.motto || ""}
                onChange={(e) =>
                  setConfig({ ...config, motto: e.target.value })
                }
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.45em] px-2">
                Institutional Emblem
              </label>
              <div className="flex items-center gap-10 bg-folusho-cream-50 p-8 rounded-[2.5rem] border border-folusho-cream-100 shadow-inner">
                <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center overflow-hidden border border-folusho-cream-200 shadow-folusho">
                  <img
                    src={config.schoolLogo || "/school_logo.png?v=20260512"}
                    alt="School Logo"
                    className="w-full h-full object-contain p-3"
                  />
                </div>
                <label className="btn-vibrant bg-white !text-folusho-slate-600 border border-folusho-cream-200 hover:border-folusho-sage-300 !py-4 !px-8 text-xs cursor-pointer shadow-sm">
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
        <div className="folusho-card space-y-12 !p-12 border-folusho-cream-200">
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-folusho-slate-900 uppercase tracking-tighter flex items-center gap-4">
              <Users size={28} className="text-folusho-coral-500" /> Executive Command
            </h2>
            <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.25em]">Validated signatures for certification</p>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.45em] px-2">
                Lead Administrator / Principal
              </label>
              <input
                type="text"
                className="input-folusho !py-5"
                placeholder="Mr. James Adeyemi"
                value={config.principalName || ""}
                onChange={(e) =>
                  setConfig({ ...config, principalName: e.target.value })
                }
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.45em] px-2">
                Supreme Proprietress
              </label>
              <input
                type="text"
                className="input-folusho !py-5"
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
            <div className="p-10 bg-folusho-cream-50 rounded-[2.5rem] border border-folusho-cream-100 shadow-inner">
              <p className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.45em] mb-12 text-center">Certification Validation Preview</p>
              <div className="grid grid-cols-2 gap-12">
                {config.principalName && (
                  <div className="text-center space-y-5">
                    <div className="h-px bg-gradient-to-r from-transparent via-folusho-sage-300 to-transparent" />
                    <p className="text-lg font-black text-folusho-slate-900 uppercase tracking-tighter truncate px-4">
                      {config.principalName}
                    </p>
                    <p className="text-[10px] text-folusho-slate-400 font-black uppercase tracking-[0.25em]">
                      Principal
                    </p>
                  </div>
                )}
                {config.proprietressName && (
                  <div className="text-center space-y-5">
                    <div className="h-px bg-gradient-to-r from-transparent via-folusho-coral-300 to-transparent" />
                    <p className="text-lg font-black text-folusho-slate-900 uppercase tracking-tighter truncate px-4">
                      {config.proprietressName}
                    </p>
                    <p className="text-[10px] text-folusho-slate-400 font-black uppercase tracking-[0.25em]">
                      Proprietress
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div className="folusho-card space-y-12 !p-12 border-folusho-cream-200">
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-folusho-slate-900 uppercase tracking-tighter flex items-center gap-4">
              <MapPin size={28} className="text-folusho-yellow-600" /> Sector Coordinates
            </h2>
            <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.25em]">Global positioning & communications</p>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.45em] px-2">
                Institutional Coordinates (Address)
              </label>
              <input
                type="text"
                className="input-folusho !py-5"
                placeholder="12 Victory Close, Ibadan, Nigeria"
                value={config.schoolAddress || ""}
                onChange={(e) =>
                  setConfig({ ...config, schoolAddress: e.target.value })
                }
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.45em] px-2">
                Comm-Link Frequency (Phone)
              </label>
              <input
                type="text"
                className="input-folusho !py-5"
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
