
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  TrendingUp, 
  IndianRupee, 
  Leaf, 
  ArrowLeft, 
  Calendar, 
  Filter, 
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Bus,
  Train,
  Car,
  Plane,
  Search,
  Shield,
  UserX,
  XCircle,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { collection, query, onSnapshot, updateDoc, doc, deleteDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { UserProfile } from '../types';
import { useTheme } from '../hooks/useTheme';
import { formatDate, formatRelativeTime } from '../utils/formatters';

// Mock Data for Charts (keeping these for visual consistency)
const BOOKING_TRENDS = [
  { name: 'Mon', bookings: 45, revenue: 12000 },
  { name: 'Tue', bookings: 52, revenue: 15000 },
  { name: 'Wed', bookings: 48, revenue: 13500 },
  { name: 'Thu', bookings: 61, revenue: 18200 },
  { name: 'Fri', bookings: 75, revenue: 22000 },
  { name: 'Sat', bookings: 88, revenue: 28500 },
  { name: 'Sun', bookings: 72, revenue: 21000 },
];

const MODE_DISTRIBUTION = [
  { name: 'Train', value: 400, color: '#2563eb' },
  { name: 'Bus', value: 300, color: '#ea580c' },
  { name: 'Cab', value: 200, color: '#4b5563' },
  { name: 'Metro', value: 150, color: '#16a34a' },
  { name: 'Flight', value: 50, color: '#9333ea' },
];

const RECENT_ALERTS = [
  { id: 1, type: 'CRITICAL', message: 'DMRC Line 2 delay reported (25 mins)', time: '5 mins ago' },
  { id: 2, type: 'WARNING', message: 'High surge in Mumbai Bandra area', time: '12 mins ago' },
  { id: 3, type: 'INFO', message: 'New MaaS provider "FreshBus" onboarded', time: '1 hr ago' },
];

interface Booking {
  id: string;
  userId: string;
  userName: string;
  mode: string;
  provider: string;
  amount: number;
  currency: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'FAILED';
  from: string;
  to: string;
  timestamp: any;
}

interface AdminDashboardPageProps {
  onBack: () => void;
}

const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [timeRange, setTimeRange] = useState('7d');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'BOOKINGS'>('OVERVIEW');

  useEffect(() => {
    if (!db) return;

    // Listen to users
    const usersQuery = query(collection(db, 'users'), limit(50));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
      setUsers(usersData);
    });

    // Listen to bookings
    const bookingsQuery = query(collection(db, 'bookings'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(bookingsData);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeBookings();
    };
  }, []);

  const handleToggleRole = async (userId: string, currentRole: string) => {
    if (!db) return;
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'users', userId), { isActive: !currentStatus });
    } catch (error) {
      console.error('Error updating active status:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-600 border-green-200';
      case 'PENDING': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'CANCELLED': return 'bg-red-100 text-red-600 border-red-200';
      case 'FAILED': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] dark:bg-slate-950 text-[#141414] dark:text-slate-100 font-sans pb-20 transition-colors duration-300">
      {/* Technical Header */}
      <header className="sticky top-0 z-40 bg-[#E4E3E0] dark:bg-slate-950 border-b border-[#141414] dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack} 
            className="hover:bg-[#141414] dark:hover:bg-slate-100 hover:text-[#E4E3E0] dark:hover:text-slate-900 border border-[#141414] dark:border-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xs font-mono uppercase tracking-widest opacity-50">System.Admin.Dashboard</h1>
            <h2 className="text-xl font-serif italic font-bold">Platform Overview</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-[#141414] dark:border-slate-800 rounded text-xs font-mono">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            SYSTEM_ONLINE
          </div>
          <Button variant="outline" size="sm" className="border-[#141414] dark:border-slate-700 text-xs font-mono">
            <Download className="h-3 w-3 mr-2" /> EXPORT_DATA
          </Button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="flex gap-4 border-b border-[#141414] dark:border-slate-800">
          {['OVERVIEW', 'USERS', 'BOOKINGS'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-2 px-4 text-xs font-mono transition-all relative ${
                activeTab === tab ? 'font-bold' : 'opacity-50 hover:opacity-100'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-[#141414] dark:bg-slate-100"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {activeTab === 'OVERVIEW' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'TOTAL_BOOKINGS', value: bookings.length || '12,482', icon: <Calendar className="h-5 w-5" />, trend: '+12.5%', color: 'text-blue-600' },
                { label: 'ACTIVE_USERS', value: users.length || '4,201', icon: <Users className="h-5 w-5" />, trend: '+8.2%', color: 'text-green-600' },
                { label: 'REVENUE_INR', value: '₹8.4M', icon: <IndianRupee className="h-5 w-5" />, trend: '+15.1%', color: 'text-orange-600' },
                { label: 'CO2_SAVED_KG', value: '2,840', icon: <Leaf className="h-5 w-5" />, trend: '+22.4%', color: 'text-emerald-600' },
              ].map((stat, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white dark:bg-slate-900 border border-[#141414] dark:border-slate-800 p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono uppercase opacity-50 tracking-tighter">{stat.label}</span>
                    <div className="opacity-30">{stat.icon}</div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-mono font-bold tracking-tighter">{stat.value}</div>
                    <div className={`text-[10px] font-mono font-bold mt-1 ${stat.trend.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {stat.trend} VS_PREV_PERIOD
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-[#141414] dark:border-slate-800 p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xs font-mono uppercase opacity-50">Analytics.Booking_Trends</h3>
                    <h4 className="text-lg font-serif italic font-bold">Weekly Performance</h4>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={BOOKING_TRENDS}>
                      <defs>
                        <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isDarkMode ? "#E4E3E0" : "#141414"} stopOpacity={0.1}/>
                          <stop offset="95%" stopColor={isDarkMode ? "#E4E3E0" : "#141414"} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#e5e7eb"} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontFamily: 'monospace', fill: isDarkMode ? '#94a3b8' : '#141414' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontFamily: 'monospace', fill: isDarkMode ? '#94a3b8' : '#141414' }} />
                      <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#141414', border: 'none', borderRadius: '4px', color: '#E4E3E0', fontFamily: 'monospace', fontSize: '10px' }} />
                      <Area type="monotone" dataKey="bookings" stroke={isDarkMode ? "#E4E3E0" : "#141414"} strokeWidth={2} fillOpacity={1} fill="url(#colorBookings)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-[#141414] dark:border-slate-800 p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
                <h3 className="text-xs font-mono uppercase opacity-50 mb-1">Analytics.Mode_Distribution</h3>
                <h4 className="text-lg font-serif italic font-bold mb-6">Transport Share</h4>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={MODE_DISTRIBUTION} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {MODE_DISTRIBUTION.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#141414', border: 'none', borderRadius: '4px', color: '#E4E3E0', fontFamily: 'monospace', fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {MODE_DISTRIBUTION.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[10px] font-mono">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span>{item.name.toUpperCase()}</span>
                      </div>
                      <span className="font-bold">{Math.round((item.value / 1100) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'USERS' && (
          <div className="bg-white dark:bg-slate-900 border border-[#141414] dark:border-slate-800 p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-xs font-mono uppercase opacity-50">Management.User_Database</h3>
                <h4 className="text-lg font-serif italic font-bold">User Directory</h4>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                <Input 
                  placeholder="SEARCH_USERS..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-[#141414] dark:border-slate-700 text-xs font-mono bg-transparent"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#141414] dark:border-slate-800 text-[10px] font-mono opacity-50">
                    <th className="pb-4 font-normal">USER_PROFILE</th>
                    <th className="pb-4 font-normal">ROLE</th>
                    <th className="pb-4 font-normal">LOYALTY_TIER</th>
                    <th className="pb-4 font-normal">JOIN_DATE</th>
                    <th className="pb-4 font-normal">WALLET</th>
                    <th className="pb-4 font-normal">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-mono divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                    <tr key={user.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!user.isActive ? 'opacity-50 grayscale' : ''}`}>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded flex items-center justify-center font-bold text-[#141414] dark:text-slate-100 border border-[#141414] dark:border-slate-700 relative">
                            {user.name.charAt(0)}
                            {!user.isActive && (
                              <div className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full border border-white dark:border-slate-900" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold">{user.name}</div>
                            <div className="opacity-50 text-[10px]">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                          user.role === 'ADMIN' 
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800' 
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                        }`}>
                          {user.role || 'USER'}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-[10px] font-bold">
                          {user.loyaltyPoints && user.loyaltyPoints > 1000 ? 'PLATINUM' : 
                           user.loyaltyPoints && user.loyaltyPoints > 500 ? 'GOLD' : 'SILVER'}
                        </span>
                      </td>
                      <td className="py-4 text-[10px] opacity-70">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-4">₹{user.walletBalance || 0}</td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleToggleRole((user as any).id, user.role || 'USER')}
                            className="h-7 px-2 border border-[#141414] dark:border-slate-700 text-[9px] hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Shield className="h-3 w-3 mr-1" /> {user.role === 'ADMIN' ? 'DEMOTE' : 'PROMOTE'}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleToggleActive((user as any).id, user.isActive !== false)}
                            className={`h-7 px-2 border text-[9px] ${
                              user.isActive === false 
                                ? 'border-green-500 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20' 
                                : 'border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                            }`}
                          >
                            {user.isActive === false ? (
                              <><CheckCircle2 className="h-3 w-3 mr-1" /> ACTIVATE</>
                            ) : (
                              <><UserX className="h-3 w-3 mr-1" /> DEACTIVATE</>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center opacity-50 italic">NO_USERS_FOUND_IN_DATABASE</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'BOOKINGS' && (
          <div className="bg-white dark:bg-slate-900 border border-[#141414] dark:border-slate-800 p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xs font-mono uppercase opacity-50">Management.Booking_Monitor</h3>
                <h4 className="text-lg font-serif italic font-bold">Real-time Feed</h4>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-[10px] font-mono border-[#141414] dark:border-slate-700">
                  <Filter className="h-3 w-3 mr-2" /> FILTER_BY_STATUS
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {bookings.length > 0 ? bookings.map((booking) => (
                <div key={booking.id} className="group relative bg-white dark:bg-slate-900 border border-[#141414] dark:border-slate-800 p-4 hover:shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)] transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 border border-[#141414] dark:border-slate-700 rounded flex items-center justify-center">
                        {booking.mode === 'CAB' && <Car className="h-5 w-5" />}
                        {booking.mode === 'BUS' && <Bus className="h-5 w-5" />}
                        {booking.mode === 'TRAIN' && <Train className="h-5 w-5" />}
                        {booking.mode === 'FLIGHT' && <Plane className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono">#{booking.id.slice(-6).toUpperCase()}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold border ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono opacity-50 mt-1">
                          {booking.userName} • {booking.provider}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <div className="text-xs font-bold font-mono">₹{booking.amount}</div>
                        <div className="text-[9px] font-mono opacity-50 uppercase">{booking.currency || 'INR'}</div>
                      </div>
                      <div className="hidden md:block text-right">
                        <div className="text-[10px] font-mono">{booking.from} → {booking.to}</div>
                        <div className="text-[9px] font-mono opacity-50">
                          {formatRelativeTime(booking.timestamp?.toDate ? booking.timestamp.toDate() : booking.timestamp)}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border border-[#141414] dark:border-slate-700">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center border border-dashed border-[#141414] dark:border-slate-800 rounded">
                  <Clock className="h-8 w-8 mx-auto opacity-20 mb-4" />
                  <p className="text-xs font-mono opacity-50 uppercase tracking-widest">Awaiting_Real_Time_Data_Stream...</p>
                  <p className="text-[10px] font-mono opacity-30 mt-2">NO_ACTIVE_BOOKINGS_RECORDED</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboardPage;
