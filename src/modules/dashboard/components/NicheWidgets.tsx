import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

interface WidgetProps {
  niche: string;
  roleData?: any;
}

export default function NicheWidgets({ niche, roleData }: WidgetProps) {
  const [menuItems, setMenuItems] = useState<{day: string, meal: string, status: string}[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Prevent overwriting local edits if a background refetch happens
    if (isEditing) return;

    if (niche === 'ketering' && roleData?.nicheDetails?.menuItems) {
      const items = roleData.nicheDetails.menuItems.map((meal: string, i: number) => ({
        day: `STAVKA ${i+1}`,
        meal: meal.toUpperCase(),
        status: 'SPREMNO'
      }));
      setMenuItems(items.length > 0 ? items : [
        { day: 'PONEDELJAK', meal: 'NEMA PODATAKA', status: '-' }
      ]);
    }
  }, [niche, roleData, isEditing]);

  const handleUpdateMenu = (index: number, newMeal: string) => {
    const newMenu = [...menuItems];
    newMenu[index].meal = newMeal.toUpperCase();
    setMenuItems(newMenu);
  };

  if (niche === 'ketering') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 group"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">DNEVNI MENI MENADŽER</h3>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-secondary/10 text-secondary text-[9px] font-black rounded-[10px] uppercase tracking-widest hover:bg-secondary hover:!text-black transition-all"
          >
            {isEditing ? 'SAČUVAJ' : 'PREGLEDAJ'}
          </button>
        </div>
        
        <div className="space-y-4">
          {menuItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-[10px]">
              <div className="flex-1">
                <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">{item.day}</div>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={item.meal} 
                    onChange={(e) => handleUpdateMenu(i, e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-[10px] px-3 py-1 text-xs font-black text-white uppercase tracking-tight w-full outline-none focus:border-secondary"
                  />
                ) : (
                  <div className="text-xs font-black text-white uppercase tracking-tight">{item.meal}</div>
                )}
              </div>
              {!isEditing && (
                <span className={`text-[8px] font-black px-2 py-1 rounded-[10px] uppercase tracking-tighter ${
                  item.status === 'SPREMNO' ? 'bg-green-500/10 text-green-500' : 'bg-secondary/10 text-secondary'
                }`}>
                  {item.status}
                </span>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (niche === 'smestaj') {
    const totalBeds = roleData?.nicheDetails?.totalBeds || 0;
    const availableBeds = roleData?.nicheDetails?.availableBeds || 0;
    const occupiedBeds = Math.max(0, totalBeds - availableBeds);

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 group"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">KAPACITET SMEŠTAJA</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${availableBeds > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{availableBeds} SLOBODNIH</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[10px] text-center">
            <div className="text-2xl font-black text-white mb-1">{totalBeds}</div>
            <div className="text-[9px] font-black text-white/20 uppercase tracking-widest">UKUPNO KREVETA</div>
          </div>
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[10px] text-center">
            <div className="text-2xl font-black text-secondary mb-1">{occupiedBeds}</div>
            <div className="text-[9px] font-black text-white/20 uppercase tracking-widest">ZAUZETO</div>
          </div>
        </div>

        <button className="w-full mt-6 py-4 bg-white/5 border border-white/10 text-white font-black rounded-[10px] text-[10px] tracking-widest uppercase hover:bg-white/10 transition-all">
          UPRAVLJAJ REZERVACIJAMA
        </button>
      </motion.div>
    );
  }

  return null;
}
