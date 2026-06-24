import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { srLatn } from 'date-fns/locale';
import { useAuth } from '@/src/context/AuthContext';
import { useActivities } from '@/src/hooks/useActivities';
import { uploadImage } from '@/src/lib/imageUtils';

const parseNotificationDate = (createdAt: any): Date => {
  if (!createdAt) return new Date();
  if (typeof createdAt.toDate === 'function') {
    return createdAt.toDate();
  }
  if (typeof createdAt === 'string' || typeof createdAt === 'number') {
    return new Date(createdAt);
  }
  if (createdAt && typeof createdAt === 'object') {
    if (typeof createdAt._seconds === 'number') {
      return new Date(createdAt._seconds * 1000);
    }
    if (typeof createdAt.seconds === 'number') {
      return new Date(createdAt.seconds * 1000);
    }
  }
  return new Date();
};

const getNotificationStyles = (type: string, isUnread: boolean) => {
  let icon = 'notifications';
  let colorClass = isUnread ? 'text-secondary bg-secondary/15' : 'text-white/60 bg-white/5';

  switch (type) {
    case 'MESSAGE_RECEIVED':
    case 'NEW_MESSAGE':
      icon = 'chat';
      colorClass = isUnread ? 'text-blue-400 bg-blue-400/15' : 'text-white/60 bg-white/5';
      break;
    case 'APPLICATION_SUBMITTED':
      icon = 'assignment';
      colorClass = isUnread ? 'text-amber-400 bg-amber-400/15' : 'text-white/60 bg-white/5';
      break;
    case 'APPLICATION_REVIEWED':
      icon = 'visibility';
      colorClass = isUnread ? 'text-cyan-400 bg-cyan-400/15' : 'text-white/60 bg-white/5';
      break;
    case 'APPLICATION_ACCEPTED':
      icon = 'check_circle';
      colorClass = isUnread ? 'text-emerald-400 bg-emerald-400/15' : 'text-white/60 bg-white/5';
      break;
    case 'APPLICATION_REJECTED':
      icon = 'cancel';
      colorClass = isUnread ? 'text-red-400 bg-red-400/15' : 'text-white/60 bg-white/5';
      break;
    case 'MATCH_FOUND':
      icon = 'handshake';
      colorClass = isUnread ? 'text-purple-400 bg-purple-400/15' : 'text-white/60 bg-white/5';
      break;
    case 'RESOURCE_AVAILABLE':
      icon = 'precision_manufacturing';
      colorClass = isUnread ? 'text-indigo-400 bg-indigo-400/15' : 'text-white/60 bg-white/5';
      break;
    case 'WALLET_TRANSACTION':
      icon = 'account_balance_wallet';
      colorClass = isUnread ? 'text-yellow-400 bg-yellow-400/15' : 'text-white/60 bg-white/5';
      break;
    case 'PROFILE_VERIFIED':
      icon = 'verified';
      colorClass = isUnread ? 'text-green-400 bg-green-400/15' : 'text-white/60 bg-white/5';
      break;
    case 'MODERATION_APPROVED':
      icon = 'gavel';
      colorClass = isUnread ? 'text-emerald-400 bg-emerald-400/15' : 'text-white/60 bg-white/5';
      break;
    case 'MODERATION_REJECTED':
      icon = 'gavel';
      colorClass = isUnread ? 'text-red-400 bg-red-400/15' : 'text-white/60 bg-white/5';
      break;
  }

  return { icon, colorClass };
};

interface DashboardTopHeaderProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export const DashboardTopHeader: React.FC<DashboardTopHeaderProps> = ({ fileInputRef }) => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const { activities, unreadCount, markAsRead, markAllAsRead } = useActivities();

  if (!user) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      setIsUploading(true);
      try {
        const url = await uploadImage(file, 'profiles/avatars', 'avatar');
        
        const updateData: any = {};
        if (user.role === 'poslodavac') {
          updateData.businessProfile = {
            ...user.businessProfile,
            logo: url
          };
          await updateUser(updateData);
        } else {
          await updateUser({ photoURL: url });
        }
      } catch (error: any) {
        alert(error.message);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleNotificationClick = (activity: any) => {
    markAsRead(activity.id);
    setShowNotifications(false);
    if (activity.link) {
      navigate(activity.link);
    }
  };

  const isEmployer = user.role === 'poslodavac';
  const isMaster = user.role === 'majstor';
  const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Korisnik';
  const userInitial = userName.charAt(0);
  const [imgError, setImgError] = React.useState(false);
  const profileSrc = user?.businessProfile?.logo || user?.photoURL;
  React.useEffect(() => { setImgError(false); }, [profileSrc]);
  return (
    <header className="hidden md:flex h-20 border-b border-white/5 bg-[#070B0F] sticky top-0 z-40 w-full">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-end h-full">
        <div className="flex items-center gap-6">
          <Link to="/postavi-oglas" className="hidden lg:flex items-center gap-2 bg-secondary !text-black px-5 py-2 rounded-[10px] font-black text-[10px] tracking-widest uppercase hover:bg-yellow-400 transition-all shadow-sm shadow-secondary/10">
            <span className="material-symbols-outlined text-lg">add_circle</span>
            POSTAVI OGLAS
          </Link>

          <div className="flex items-center gap-2 relative">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange}
            />
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2.5 rounded-[10px] transition-all ${showNotifications ? 'bg-secondary !text-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-secondary rounded-full border-2 border-[#070B0F]"></span>}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute top-full right-0 mt-4 w-96 bg-slate-950/95 backdrop-blur-md border border-white/10 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] z-50 overflow-hidden"
                >
                  <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                    <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">Obaveštenja</h4>
                    <button onClick={markAllAsRead} className="text-[10px] font-black text-secondary uppercase tracking-widest hover:text-yellow-400 transition-colors">Označi sve kao pročitano</button>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto no-scrollbar divide-y divide-white/5">
                    {activities.length > 0 ? activities.map((n: any, index: number) => {
                      const { icon, colorClass } = getNotificationStyles(n.type, n.read === false);
                      return (
                        <div 
                          key={`${n.id || 'no-id'}-${index}`} 
                          onClick={() => handleNotificationClick(n)} 
                          className={`p-5 hover:bg-white/[0.02] border-b border-white/5 transition-all cursor-pointer group flex gap-4 items-start ${n.read === false ? 'bg-secondary/[0.02] border-l-2 border-l-secondary pl-[18px]' : 'pl-5'}`}
                        >
                          <div className={`w-9 h-9 rounded-lg ${colorClass} flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-all`}>
                            <span className="material-symbols-outlined text-lg">{icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline gap-2 mb-1">
                              <h5 className={`text-xs font-bold truncate ${n.read === false ? 'text-white' : 'text-white/70'}`}>{n.title}</h5>
                              <span className="text-[8px] font-medium text-white/30 whitespace-nowrap shrink-0">{n.createdAt ? formatDistanceToNow(parseNotificationDate(n.createdAt), { addSuffix: true, locale: srLatn }) : ''}</span>
                            </div>
                            <p className="text-[10px] text-white/40 font-medium leading-normal line-clamp-2 uppercase tracking-wide">{n.message}</p>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="p-10 text-center flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined text-white/20 text-4xl">notifications_off</span>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Trenutno nemate novih obaveštenja</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-white/[0.01] border-t border-white/5">
                    <button 
                      onClick={() => { navigate('/moj-profil/obavestenja'); setShowNotifications(false); }}
                      className="w-full py-3 text-[10px] font-black text-white/40 hover:text-white uppercase tracking-widest transition-all text-center"
                    >
                      PRIKAŽI SVA OBAVEŠTENJA
                    </button>
                  </div>
                </motion.div>
              </>
            )}

            <Link to="/poruke" className="p-2.5 text-white/40 hover:text-white hover:bg-white/5 rounded-[10px] transition-all">
              <span className="material-symbols-outlined">mail</span>
            </Link>
          </div>

          <div className="h-8 w-px bg-white/5"></div>

          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="text-right">
              <div className="text-[11px] font-black text-white uppercase tracking-tight">
                {isEmployer ? (user.company || userName) : userName}
              </div>
              <div className="flex items-center justify-end gap-1.5">
                {user.businessProfile?.isVerified && (
                  <span className="material-symbols-outlined text-green-500 text-[14px]">verified</span>
                )}
                {user.businessProfile?.isPremium && (
                  <span className="material-symbols-outlined text-secondary text-[14px]">workspace_premium</span>
                )}
                <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                  {isEmployer ? (user.businessProfile?.niche || 'POSLODAVAC') : isMaster ? 'MAJSTOR' : 'STANDARD'}
                </div>
              </div>
            </div>
            <div 
              className="w-10 h-10 rounded-[10px] bg-white flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-secondary transition-all shrink-0 p-1 shadow-lg shadow-black/20 relative cursor-pointer"
            >
               {profileSrc && !imgError ? (
                   <img width="800" height="600" decoding="async" src={profileSrc} alt="Profile" className="w-full h-full object-contain" referrerPolicy="no-referrer" loading="lazy" onError={() => setImgError(true)} /> 
                 ) : (
                   <span className="font-black !text-black text-lg">{userInitial}</span>
                 )}
                {/* Subtle upload indicator */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {isUploading ? (
                    <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="material-symbols-outlined text-white text-base">publish</span>
                  )}
                </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
