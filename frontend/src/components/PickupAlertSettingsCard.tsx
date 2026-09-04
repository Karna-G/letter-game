import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Compass, Radio, Volume2, VolumeX, CheckCircle } from 'lucide-react';
import { getPickupAlertSettings, updatePickupAlertSettings, type PickupAlertSettings } from '../api';
import { waxSealAudio } from '../utils/waxSealAudio';

interface PickupAlertSettingsCardProps {
  userId: string;
  onSettingsUpdated?: (settings: PickupAlertSettings) => void;
}

export const PickupAlertSettingsCard: React.FC<PickupAlertSettingsCardProps> = ({
  userId,
  onSettingsUpdated
}) => {
  const [settings, setSettings] = useState<PickupAlertSettings>({
    enabled: true,
    radiusMeters: 250,
    soundEnabled: true,
    notifyAllCouriers: false
  });
  const [, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const RADIUS_OPTIONS = [50, 100, 250, 500, 1000];

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getPickupAlertSettings(userId)
      .then((data) => {
        if (data) setSettings(data);
      })
      .catch((err) => console.error('Error loading pickup alert settings:', err))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSave = async (updated: Partial<PickupAlertSettings>) => {
    const newSettings = { ...settings, ...updated };
    setSettings(newSettings);
    setSaving(true);
    setSaveSuccess(null);

    try {
      const res = await updatePickupAlertSettings(userId, newSettings);
      setSaveSuccess(res.message || 'Perimeter alert settings synchronized!');
      if (onSettingsUpdated) onSettingsUpdated(newSettings);
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestChime = () => {
    waxSealAudio.playCourierProximityChime();
  };

  return (
    <div 
      className="theatrical-card p-6 md:p-8 rounded-sm shadow-2xl relative overflow-hidden"
      style={{
        background: 'linear-gradient(165deg, #1C1915 0%, #12100E 100%)',
        border: '1px solid var(--antique-gold)',
        boxShadow: '0 15px 35px rgba(0,0,0,0.7)'
      }}
    >
      {/* Top Gold Bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, var(--antique-gold), transparent)' }} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-amber-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-widest font-semibold text-amber-400" style={{ fontFamily: "'Cinzel', serif" }}>
              Imperial Vicinity Radar
            </span>
            <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30">
              ● Active Radar
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold flex items-center gap-2.5" style={{ color: 'var(--parchment-light)', fontFamily: "'Cinzel Decorative', serif" }}>
            <Compass className="w-6 h-6 text-amber-400 animate-float-slow" />
            Letter Pickup Radius Alerts
          </h3>
          <p className="text-xs md:text-sm italic mt-1" style={{ color: 'var(--gold-muted)' }}>
            Get a chime and a notification the moment a courier comes within range of you.
          </p>
        </div>

        <button
          onClick={handleTestChime}
          className="btn-gold-saloon text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-md flex-shrink-0"
          title="Play postal horn chime"
        >
          <Volume2 className="w-4 h-4 text-emerald-400" />
          <span>Test Chime Audio</span>
        </button>
      </div>

      {saveSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-4 p-3 rounded-sm text-xs font-bold flex items-center gap-2 bg-emerald-950/80 text-emerald-300 border border-emerald-500/40"
        >
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{saveSuccess}</span>
        </motion.div>
      )}

      <div className="space-y-6">
        {/* Toggle Alerts Master */}
        <div className="flex items-center justify-between p-4 rounded-sm bg-white/[0.03] border border-amber-500/20">
          <div>
            <span className="text-sm font-bold block" style={{ color: 'var(--parchment)', fontFamily: "'Cinzel', serif" }}>
              Alert me when a courier is nearby
            </span>
            <span className="text-xs italic" style={{ color: 'var(--gold-muted)' }}>
              Alert me whenever a courier passes near my location.
            </span>
          </div>
          <button
            onClick={() => handleSave({ enabled: !settings.enabled })}
            disabled={saving}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.enabled ? 'bg-emerald-600' : 'bg-zinc-700'
            }`}
          >
            <div 
              className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                settings.enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Radius Preset Chips */}
        <div className="p-4 rounded-sm bg-white/[0.03] border border-amber-500/20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
            <div>
              <span className="text-sm font-bold block flex items-center gap-1.5" style={{ color: 'var(--parchment)', fontFamily: "'Cinzel', serif" }}>
                <Radio className="w-4 h-4 text-amber-400" />
                Alert me within: <span className="text-amber-300 ml-1">{settings.radiusMeters} meters</span>
              </span>
              <span className="text-xs italic" style={{ color: 'var(--gold-muted)' }}>
                You will be alerted when a courier comes this close to you.
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => handleSave({ radiusMeters: r })}
                disabled={saving || !settings.enabled}
                className="px-4 py-2 rounded-sm text-xs font-bold border transition-all"
                style={{
                  fontFamily: "'Cinzel', serif",
                  background: settings.radiusMeters === r ? 'var(--burgundy)' : 'rgba(255,255,255,0.05)',
                  color: settings.radiusMeters === r ? '#FFF' : 'var(--gold-muted)',
                  border: settings.radiusMeters === r ? '1px solid var(--antique-gold)' : '1px solid rgba(212,175,55,0.25)',
                  transform: settings.radiusMeters === r ? 'scale(1.04)' : 'none',
                  opacity: settings.enabled ? 1 : 0.5
                }}
              >
                {r} meters {r === 250 ? '(Default)' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Sound & Trigger Mode Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sound Toggle */}
          <div className="p-4 rounded-sm bg-white/[0.03] border border-amber-500/20 flex items-center justify-between">
            <div className="pr-3">
              <span className="text-sm font-bold block flex items-center gap-1.5" style={{ color: 'var(--parchment)', fontFamily: "'Cinzel', serif" }}>
                {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-400" />}
                Postal Bell Fanfare
              </span>
              <span className="text-xs italic" style={{ color: 'var(--gold-muted)' }}>
                Play a three-note brass chime when a courier arrives.
              </span>
            </div>
            <button
              onClick={() => handleSave({ soundEnabled: !settings.soundEnabled })}
              disabled={saving || !settings.enabled}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.soundEnabled && settings.enabled ? 'bg-emerald-600' : 'bg-zinc-700'
              }`}
            >
              <div 
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  settings.soundEnabled && settings.enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Trigger Scope Toggle */}
          <div className="p-4 rounded-sm bg-white/[0.03] border border-amber-500/20 flex items-center justify-between">
            <div className="pr-3">
              <span className="text-sm font-bold block" style={{ color: 'var(--parchment)', fontFamily: "'Cinzel', serif" }}>
                {settings.notifyAllCouriers ? 'All Realm Mailmen' : 'Pending Letters Only'}
              </span>
              <span className="text-xs italic" style={{ color: 'var(--gold-muted)' }}>
                {settings.notifyAllCouriers
                  ? 'Alert whenever any mailman enters perimeter.'
                  : 'Only alert me when I have a letter waiting for pickup.'}
              </span>
            </div>
            <button
              onClick={() => handleSave({ notifyAllCouriers: !settings.notifyAllCouriers })}
              disabled={saving || !settings.enabled}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.notifyAllCouriers && settings.enabled ? 'bg-amber-600' : 'bg-zinc-700'
              }`}
            >
              <div 
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  settings.notifyAllCouriers && settings.enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
