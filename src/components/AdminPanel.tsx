import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { useLanguage } from '../LanguageContext';
import { useCurrency } from '../CurrencyContext';
import { RefreshCw, Users, HelpCircle, HardDrive, Filter, X, Plus, CheckCircle2, Trash2 } from 'lucide-react';

interface AdminPanelProps {
  projects: Project[];
  onAddCustomProject: (project: Project) => void;
  onResetCMS: () => void;
}

interface LocalLead {
  name: string;
  email: string;
  phone: string;
  project: string;
  time: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  projects,
  onAddCustomProject,
  onResetCMS,
}) => {
  const { t } = useLanguage();
  const { convertPrice } = useCurrency();

  // CMS state overrides
  const [leads, setLeads] = useState<LocalLead[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // New Property addition form state
  const [newPropName, setNewPropName] = useState('');
  const [newPropPrice, setNewPropPrice] = useState('680000');
  const [newPropLocation, setNewPropLocation] = useState('Persiaran KLCC, Kuala Lumpur');
  const [newPropArea, setNewPropArea] = useState('Kuala Lumpur');
  const [newPropDev, setNewPropDev] = useState('Exclusive Developer Group');
  const [newPropBuiltUp, setNewPropBuiltUp] = useState('1100');
  const [newPropBedrooms, setNewPropBedrooms] = useState('3');
  const [newPropType, setNewPropType] = useState('Serviced residence');
  const [newPropStatus, setNewPropStatus] = useState('Ready To Move');
  const [newPropTenure, setNewPropTenure] = useState('Freehold');

  // Load local mock lead table submissions
  const fetchLeads = () => {
    setIsRefreshing(true);
    try {
      const stored = localStorage.getItem('portal_leads');
      if (stored) {
        setLeads(JSON.parse(stored));
      } else {
        // Mock some initially to show a professional CRM table setup
        const initialLeads: LocalLead[] = [
          { name: "John Lim", email: "johnlim@yahoo.com.sg", phone: "+65 9123 4567", project: "Sensory Residence SE", time: "2026-06-11 14:22" },
          { name: "Suresh Pillai", email: "suresh.p@gamil.com", phone: "+60 12-445 9291", project: "EkoCheras Complex", time: "2026-06-11 11:05" },
          { name: "Emily Choong", email: "emilyc@gmail.com", phone: "+60 17-559 8133", project: "Trion @ KL", time: "2026-06-10 16:48" }
        ];
        localStorage.setItem('portal_leads', JSON.stringify(initialLeads));
        setLeads(initialLeads);
      }
    } catch (e) {
      console.warn(e);
    }
    setTimeout(() => setIsRefreshing(false), 600);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleCreatePropSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName) return alert('Name required');

    const created: Project = {
      id: `custom-${Date.now()}`,
      name: newPropName,
      developer: newPropDev,
      startingPrice: parseInt(newPropPrice) || 500000,
      location: newPropLocation,
      area: newPropArea,
      projectType: newPropType,
      completionStatus: newPropStatus,
      completionYear: newPropStatus === 'Ready To Move' ? '2025' : '2028',
      tenure: newPropTenure,
      builtUpMin: parseInt(newPropBuiltUp) - 100 || 800,
      builtUpMax: parseInt(newPropBuiltUp) + 120 || 1200,
      bedroomsMin: parseInt(newPropBedrooms) - 1 || 2,
      bedroomsMax: parseInt(newPropBedrooms) || 3,
      isHot: true,
      images: {
        overview: [
          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=800&auto=format&fit=crop"
        ],
        location: [],
        layout: [],
        gallery: [
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop"
        ]
      },
      syncedAt: new Date().toISOString().substring(0, 10),
    };

    onAddCustomProject(created);
    alert('Project simulated into Sheet-CMS client memory!');
    
    // reset prop form
    setNewPropName('');
  };

  const handleClearLeads = () => {
    if (confirm('Clear CRM leads log?')) {
      localStorage.removeItem('portal_leads');
      setLeads([]);
    }
  };

  return (
    <section id="cms-control-dashboard" className="py-16 bg-slate-50/30 min-h-[90vh] text-slate-900 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-slate-100 select-none">
          <div>
            <span className="block text-xs font-black uppercase tracking-widest text-[#dc2743] mb-1 font-sans">
              PORTAL CONTROL CORE
            </span>
            <h2 className="text-3xl font-[800] text-slate-900 tracking-tight leading-none">
              Client Portal CMS & CRM Dashboard
            </h2>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onResetCMS}
              className="px-5 py-3 bg-white text-slate-700 font-extrabold text-xs border border-slate-100 rounded-full hover:bg-slate-50 transition-all cursor-pointer btn-hover"
            >
              Reset Sheet Sync Cache
            </button>
            <button
              onClick={fetchLeads}
              className="px-5 py-3 bg-slate-900 text-white font-extrabold text-xs rounded-full hover:bg-slate-800 flex items-center gap-1.5 transition-all cursor-pointer btn-hover shadow-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Reload CRM Logs
            </button>
          </div>
        </div>

        {/* Info Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Total Synchronized</span>
              <HardDrive className="h-5 w-5 text-orange-500" />
            </div>
            <h3 className="text-2xl font-[800] text-slate-900">{projects.length} Sheets Listings</h3>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Automatic Google Sheets API cache sync active (10 minute loop)</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">CRM Leads Received</span>
              <Users className="h-5 w-5 text-orange-500" />
            </div>
            <h3 className="text-2xl font-[800] text-slate-900">{leads.length} Contacts</h3>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Stored dynamically inside client browser session storage log</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Server Status</span>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-[800] text-slate-900">SYSTEM STABLE</h3>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Dual Express router and Antigravity telemetry engines active</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: CRM lead inbox */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6 select-none">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">CRM Sales Lead Inbox</h4>
                  <p className="text-xs text-slate-400 font-medium">Review customers requesting WhatsApp callbacks from contact widgets.</p>
                </div>
                {leads.length > 0 && (
                  <button
                    onClick={handleClearLeads}
                    className="p-2.5 text-slate-400 hover:text-red-600 rounded-full bg-slate-50 transition-colors cursor-pointer"
                    title="Clear Logs"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                )}
              </div>

              {leads.length === 0 ? (
                <div className="text-center py-20 text-slate-400 select-none">
                  <p className="text-xs font-semibold">CRM Log Empty. Test by filling out a project detail form!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase font-black text-[9px] tracking-wider">
                        <th className="py-2.5">Name</th>
                        <th className="py-2.5">Contact Method</th>
                        <th className="py-2.5">Target Listing</th>
                        <th className="py-2.5">Received At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700 font-semibold">
                      {leads.map((l, i) => (
                        <tr key={i}>
                          <td className="py-3.5 font-bold text-slate-900">{l.name}</td>
                          <td className="py-3.5">
                            <span className="block text-slate-900">{l.phone}</span>
                            <span className="block text-[10px] text-slate-400 font-medium">{l.email}</span>
                          </td>
                          <td className="py-3.5 font-black text-[#dc2743]">{l.project}</td>
                          <td className="py-3.5 text-slate-400 text-[10px]">{l.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-8 p-4 bg-orange-50/40 rounded-2xl border border-orange-100/50 text-slate-600 text-xs font-medium">
              <strong>CRM Notification Rules:</strong> Direct client-side WhatsApp link bypassing is enabled by default to prevent drop-off rates on mobile platforms.
            </div>
          </div>

          {/* RIGHT: Property addition simulator */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h4 className="text-lg font-bold text-slate-900 mb-1">Add In-Memory Project</h4>
            <p className="text-xs text-slate-400 mb-6 font-medium">
              Simulate manual entries directly into client dataset state. Perfect for testing layout scalability.
            </p>

            <form onSubmit={handleCreatePropSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sentral Skyline Residence"
                  value={newPropName}
                  onChange={(e) => setNewPropName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-full p-2.5 px-4 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Price (MYR)</label>
                  <input
                    type="number"
                    value={newPropPrice}
                    onChange={(e) => setNewPropPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-full p-2.5 px-4 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Area Region</label>
                  <select
                    value={newPropArea}
                    onChange={(e) => setNewPropArea(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-full p-2.5 px-4 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="Kuala Lumpur">Kuala Lumpur</option>
                    <option value="Johor Bahru">Johor Bahru</option>
                    <option value="Cheras">Cheras</option>
                    <option value="Subang Jaya">Subang Jaya</option>
                    <option value="Penang">Penang</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Exact Location String</label>
                <input
                  type="text"
                  value={newPropLocation}
                  onChange={(e) => setNewPropLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-full p-2.5 px-4 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Rooms</label>
                  <input
                    type="number"
                    value={newPropBedrooms}
                    onChange={(e) => setNewPropBedrooms(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-full p-2.5 px-4 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Size (sqft)</label>
                  <input
                    type="number"
                    value={newPropBuiltUp}
                    onChange={(e) => setNewPropBuiltUp(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-full p-2.5 px-4 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Tenure</label>
                  <select
                    value={newPropTenure}
                    onChange={(e) => setNewPropTenure(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-full p-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="Freehold">Freehold</option>
                    <option value="Leasehold">Leasehold</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 ig-gradient text-white font-extrabold text-xs tracking-widest uppercase rounded-full shadow-lg shadow-orange-500/10 hover:opacity-95 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer btn-hover font-sans"
              >
                <Plus className="h-4 w-4" />
                <span>Inject CMS Project Entry</span>
              </button>
            </form>
          </div>

        </div>

      </div>
    </section>
  );
};
