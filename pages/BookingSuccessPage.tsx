import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Download, Calendar, Share2, ArrowRight, Home, MapPin, Clock, User, CreditCard } from 'lucide-react';
import { Button } from '../components/Button';
import { motion } from 'motion/react';
import { getUserBookings } from '../services/bookingService';
import { Booking } from '../types';
import { generateInvoicePDF } from '../utils/invoiceGenerator';

export const BookingSuccessPage: React.FC = () => {
    const { bookingId } = useParams<{ bookingId: string }>();
    const navigate = useNavigate();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBooking = async () => {
            const bookings = getUserBookings();
            const found = bookings.find(b => b.id === bookingId);
            if (found) {
                setBooking(found);
            }
            setLoading(false);
        };
        fetchBooking();
    }, [bookingId]);

    const handleDownload = async () => {
        if (booking) {
            await generateInvoicePDF(booking);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <CheckCircle className="h-16 w-16 text-gray-300 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
                <p className="text-gray-600 mb-6">We couldn't find the details for this booking.</p>
                <Button onClick={() => navigate('/')}>Go to Home</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 pb-24">
            <div className="max-w-3xl mx-auto">
                {/* Success Header */}
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center mb-10"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Booking Confirmed!</h1>
                    <p className="text-lg text-gray-600">Your trip to {booking.destination || 'your destination'} is all set.</p>
                    <div className="mt-4 inline-block bg-brand-50 text-brand-700 px-4 py-1.5 rounded-full text-sm font-bold border border-brand-100">
                        Booking ID: {booking.id}
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Ticket Info */}
                    <div className="md:col-span-2 space-y-6">
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
                        >
                            <div className="bg-brand-600 px-6 py-4 text-white flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span className="text-sm font-medium">Travel Ticket</span>
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider">{booking.option.mode}</span>
                            </div>
                            
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-8">
                                    <div className="text-center md:text-left">
                                        <div className="text-3xl font-bold text-gray-900">{booking.origin?.split(',')[0] || 'Origin'}</div>
                                        <div className="text-sm text-gray-500">{booking.option.departureTime}</div>
                                    </div>
                                    <div className="flex flex-col items-center px-4 flex-1">
                                        <div className="w-full border-t-2 border-dashed border-gray-200 relative">
                                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white px-2">
                                                <ArrowRight className="h-4 w-4 text-brand-600" />
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-widest">{booking.option.duration}</span>
                                    </div>
                                    <div className="text-center md:text-right">
                                        <div className="text-3xl font-bold text-gray-900">{booking.destination?.split(',')[0] || 'Dest'}</div>
                                        <div className="text-sm text-gray-500">{booking.option.arrivalTime || '--:--'}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
                                    <div>
                                        <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Date</div>
                                        <div className="text-sm font-bold text-gray-900">{new Date(booking.travelDate || '').toLocaleDateString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">PNR</div>
                                        <div className="text-sm font-bold text-gray-900 font-mono">{booking.pnr || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Seats</div>
                                        <div className="text-sm font-bold text-gray-900">{booking.passengers.length} Adult(s)</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Class</div>
                                        <div className="text-sm font-bold text-gray-900">Economy</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex flex-wrap gap-4 justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-white rounded border border-gray-200 flex items-center justify-center">
                                        <User className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <div className="text-xs">
                                        <div className="text-gray-400">Primary Traveler</div>
                                        <div className="font-bold text-gray-900">{booking.passengers[0]?.name}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={handleDownload} className="h-9">
                                        <Download className="h-4 w-4 mr-2" /> E-Ticket
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-9">
                                        <Share2 className="h-4 w-4 mr-2" /> Share
                                    </Button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Important Info */}
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-blue-50 rounded-2xl p-6 border border-blue-100"
                        >
                            <h3 className="text-blue-800 font-bold mb-3 flex items-center gap-2">
                                <Clock className="h-5 w-5" /> Important Information
                            </h3>
                            <ul className="space-y-2 text-sm text-blue-700">
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 shrink-0"></span>
                                    Please carry a valid photo ID for verification at the station/airport.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 shrink-0"></span>
                                    Reach the boarding point at least 45 minutes before departure.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 shrink-0"></span>
                                    A copy of this ticket has been sent to your registered email and phone.
                                </li>
                            </ul>
                        </motion.div>
                    </div>

                    {/* Sidebar: Summary & Actions */}
                    <div className="space-y-6">
                        <motion.div 
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
                        >
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Summary</h3>
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Base Fare</span>
                                    <span className="font-medium text-gray-900">₹{(booking.totalAmount * 0.85).toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Taxes & Fees</span>
                                    <span className="font-medium text-gray-900">₹{(booking.totalAmount * 0.15).toFixed(0)}</span>
                                </div>
                                <div className="pt-3 border-t border-gray-100 flex justify-between">
                                    <span className="font-bold text-gray-900">Total Paid</span>
                                    <span className="font-bold text-brand-600 text-lg">₹{booking.totalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 mb-6">
                                <CreditCard className="h-5 w-5 text-gray-400" />
                                <div className="text-xs">
                                    <div className="text-gray-400">Paid via</div>
                                    <div className="font-bold text-gray-900">UPI / PhonePe</div>
                                </div>
                            </div>
                            <Button className="w-full mb-3" onClick={() => navigate('/my-trips')}>
                                View My Trips
                            </Button>
                            <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                                <Home className="h-4 w-4 mr-2" /> Back to Home
                            </Button>
                        </motion.div>

                        <motion.div 
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-6 text-white text-center"
                        >
                            <h3 className="font-bold text-lg mb-2">Refer & Earn</h3>
                            <p className="text-brand-100 text-xs mb-4">Share OneYatra with friends and get ₹100 off on your next trip!</p>
                            <Button 
                                variant="outline" 
                                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                                onClick={() => navigate('/refer')}
                            >
                                Get Referral Code
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingSuccessPage;
