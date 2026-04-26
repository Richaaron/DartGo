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
      } catch (error) {
        console.error("Failed to load config", error);
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
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          School Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          These details appear on student report cards and across the portal.
        </p>
      </div>

      {/* Save Message */}
      {message.text && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
              : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
          }`}
        >
          <CheckCircle size={20} />
          <p className="font-semibold">{message.text}</p>
        </div>
      )}

      {/* Row 1: General Info + Branding */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Info */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <Globe size={18} className="text-blue-500" /> General Info
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                School Name
              </label>
              <input
                type="text"
                className="input-field"
                value={config.schoolName || ""}
                onChange={(e) =>
                  setConfig({ ...config, schoolName: e.target.value })
                }
                placeholder="e.g. Folusho Victory Schools"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Current Term
                </label>
                <select
                  className="input-field"
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
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 2024/2025"
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
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <Palette size={18} className="text-purple-500" /> Branding
          </h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Theme Color
              </label>
              <div className="flex gap-4 items-center">
                <input
                  type="color"
                  className="w-12 h-12 rounded-lg cursor-pointer border border-gray-200"
                  value={config.themeColor || "#2563eb"}
                  onChange={(e) =>
                    setConfig({ ...config, themeColor: e.target.value })
                  }
                />
                <code className="bg-gray-100 dark:bg-gray-800 dark:text-gray-300 px-3 py-1.5 rounded-lg text-sm font-mono">
                  {config.themeColor || "#2563eb"}
                </code>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                School Logo
              </label>
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center overflow-hidden">
                  {config.schoolLogo ? (
                    <img
                      src={config.schoolLogo}
                      alt="School Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="text-gray-300" size={28} />
                  )}
                </div>
                <label className="cursor-pointer bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all text-sm">
                  Change Logo
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
      </div>

      {/* Row 2: School Officials + Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* School Officials */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Users size={18} className="text-indigo-500" /> School Officials
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
            These names will appear on the signature section of every student's
            report card.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                Principal's Name
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Mr. James Adeyemi"
                value={config.principalName || ""}
                onChange={(e) =>
                  setConfig({ ...config, principalName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                Proprietress's Name
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Mrs. Folusho Adekunle"
                value={config.proprietressName || ""}
                onChange={(e) =>
                  setConfig({ ...config, proprietressName: e.target.value })
                }
              />
            </div>
          </div>

          {/* Preview */}
          {(config.principalName || config.proprietressName) && (
            <div className="mt-5 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">
                Report Card Preview
              </p>
              <div className="grid grid-cols-2 gap-4">
                {config.principalName && (
                  <div className="text-center">
                    <div className="h-px bg-indigo-200 dark:bg-indigo-700 mb-2" />
                    <p className="text-xs font-black text-gray-800 dark:text-white uppercase truncate">
                      {config.principalName}
                    </p>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-0.5">
                      Principal
                    </p>
                  </div>
                )}
                {config.proprietressName && (
                  <div className="text-center">
                    <div className="h-px bg-indigo-200 dark:bg-indigo-700 mb-2" />
                    <p className="text-xs font-black text-gray-800 dark:text-white uppercase truncate">
                      {config.proprietressName}
                    </p>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-0.5">
                      Proprietress
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <MapPin size={18} className="text-rose-500" /> Contact Information
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
            These appear in the header of every printed report card.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                School Address
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. 12 Victory Close, Ibadan, Nigeria"
                value={config.schoolAddress || ""}
                onChange={(e) =>
                  setConfig({ ...config, schoolAddress: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                School Phone Number
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. +234 801 234 5678"
                value={config.schoolPhone || ""}
                onChange={(e) =>
                  setConfig({ ...config, schoolPhone: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50 text-sm"
        >
          <Save size={18} /> {isSaving ? "Saving..." : "Save All Settings"}
        </button>
      </div>
    </div>
  );
}
