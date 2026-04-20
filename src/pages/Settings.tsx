import { useState, useEffect } from 'react'
import type { ChangeEvent } from 'react'
import { Save, Palette, Globe, Image as ImageIcon, CheckCircle } from 'lucide-react'
import { fetchConfig, updateConfig } from '../services/api'

export default function Settings() {
  const [config, setConfig] = useState<any>({
    schoolName: '',
    currentTerm: '',
    currentAcademicYear: '',
    themeColor: '#2563eb',
    availableClasses: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await fetchConfig()
        setConfig(data)
      } catch (error) {
        console.error('Failed to load config', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadConfig()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateConfig(config)
      setMessage({ type: 'success', text: 'Settings updated successfully!' })
      window.setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      // Apply theme color globally
      document.documentElement.style.setProperty('--primary-color', config.themeColor)
    } catch {
      setMessage({ type: 'error', text: 'Failed to update settings' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = (e: ChangeEvent<any>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new window.FileReader()
    reader.onloadend = () => {
      setConfig({ ...config, schoolLogo: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  if (isLoading) return <div className="p-8 text-center">Loading settings...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">School Settings</h1>
        <p className="text-gray-600 mt-2">Customize your school's portal branding and session details</p>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <CheckCircle size={20} />
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* General Settings */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Globe size={20} className="text-blue-500" /> General Info
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">School Name</label>
              <input 
                type="text" 
                className="input-field" 
                value={config.schoolName}
                onChange={(e) => setConfig({ ...config, schoolName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Current Term</label>
                <select 
                  className="input-field"
                  value={config.currentTerm}
                  onChange={(e) => setConfig({ ...config, currentTerm: e.target.value })}
                >
                  <option value="1st Term">1st Term</option>
                  <option value="2nd Term">2nd Term</option>
                  <option value="3rd Term">3rd Term</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Academic Year</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. 2023/2024"
                  value={config.currentAcademicYear}
                  onChange={(e) => setConfig({ ...config, currentAcademicYear: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Branding Settings */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Palette size={20} className="text-purple-500" /> Branding
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Theme Color</label>
              <div className="flex gap-4 items-center">
                <input 
                  type="color" 
                  className="w-12 h-12 rounded cursor-pointer"
                  value={config.themeColor}
                  onChange={(e) => setConfig({ ...config, themeColor: e.target.value })}
                />
                <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">{config.themeColor}</code>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">School Logo</label>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                  {config.schoolLogo ? (
                    <img src={config.schoolLogo} alt="School Logo" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="text-gray-300" size={32} />
                  )}
                </div>
                <label className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-100 transition-all">
                  Change Logo
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50"
        >
          <Save size={20} /> {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
