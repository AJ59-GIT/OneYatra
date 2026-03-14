import React from 'react';
import { CreditCard, Wallet, Landmark, Smartphone, Building2, Tag, Gift, Trash2, Lock, Info, AlertTriangle, CheckCircle, QrCode, Clock, ChevronDown, ShieldCheck, XCircle } from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Booking, PaymentMethod, SavedCard } from '../../types';

interface BookingPaymentProps {
  booking: Booking;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  upiMode: 'QR' | 'ID';
  setUpiMode: (mode: 'QR' | 'ID') => void;
  upiId: string;
  setUpiId: (id: string) => void;
  selectedWallet: string;
  setSelectedWallet: (wallet: string) => void;
  selectedBank: string;
  setSelectedBank: (bank: string) => void;
  walletBalance: number;
  savedCards: SavedCard[];
  selectedCardId: string;
  setSelectedCardId: (id: string) => void;
  saveCardForFuture: boolean;
  setSaveCardForFuture: (save: boolean) => void;
  newCard: { number: string; expiry: string; cvv: string; name: string };
  setNewCard: (card: any) => void;
  savedCardCvv: string;
  setSavedCardCvv: (cvv: string) => void;
  promoCode: string;
  setPromoCode: (code: string) => void;
  appliedDiscount: { code: string; amount: number } | null;
  promoStatus: 'IDLE' | 'VALIDATING' | 'SUCCESS' | 'ERROR';
  promoMessage: string;
  isPromoOpen: boolean;
  setIsPromoOpen: (open: boolean) => void;
  giftCardCode: string;
  setGiftCardCode: (code: string) => void;
  appliedGiftCard: { code: string; amount: number } | null;
  giftCardStatus: 'IDLE' | 'VALIDATING' | 'SUCCESS' | 'ERROR';
  giftCardMessage: string;
  paymentError: string | null;
  isB2BMode: boolean;
  requiresApproval: boolean;
  policyViolations: string[];
  onApplyPromo: () => void;
  onRemovePromo: () => void;
  onApplyGiftCard: () => void;
  onRemoveGiftCard: () => void;
  onDeleteSavedCard: (id: string, e: React.MouseEvent) => void;
  onPay: () => void;
  subTotal: number;
  seatCost: number;
  mealCost: number;
  specialRequestCost: number;
}

const WALLETS = [
    { id: 'PAYTM', name: 'Paytm', icon: 'P' },
    { id: 'PHONEPE', name: 'PhonePe', icon: 'Ph' },
    { id: 'AMAZONPAY', name: 'Amazon Pay', icon: 'A' },
    { id: 'MOBIKWIK', name: 'MobiKwik', icon: 'M' }
];

const POPULAR_BANKS = [
    { id: 'SBI', name: 'SBI', logo: '🏦' },
    { id: 'HDFC', name: 'HDFC', logo: '🏦' },
    { id: 'ICICI', name: 'ICICI', logo: '🏦' },
    { id: 'AXIS', name: 'Axis', logo: '🏦' }
];

export const BookingPayment: React.FC<BookingPaymentProps> = ({
  booking,
  paymentMethod,
  setPaymentMethod,
  upiMode,
  setUpiMode,
  upiId,
  setUpiId,
  selectedWallet,
  setSelectedWallet,
  selectedBank,
  setSelectedBank,
  walletBalance,
  savedCards,
  selectedCardId,
  setSelectedCardId,
  saveCardForFuture,
  setSaveCardForFuture,
  newCard,
  setNewCard,
  savedCardCvv,
  setSavedCardCvv,
  promoCode,
  setPromoCode,
  appliedDiscount,
  promoStatus,
  promoMessage,
  isPromoOpen,
  setIsPromoOpen,
  giftCardCode,
  setGiftCardCode,
  appliedGiftCard,
  giftCardStatus,
  giftCardMessage,
  paymentError,
  isB2BMode,
  requiresApproval,
  policyViolations,
  onApplyPromo,
  onRemovePromo,
  onApplyGiftCard,
  onRemoveGiftCard,
  onDeleteSavedCard,
  onPay,
  subTotal,
  seatCost,
  mealCost,
  specialRequestCost
}) => {
  const discountAmount = appliedDiscount ? appliedDiscount.amount : 0;
  let paymentFee = paymentMethod === 'NETBANKING' ? 20 : 0;
  const intermediateTotal = Math.max(0, subTotal - discountAmount + paymentFee);
  const giftCardAmount = appliedGiftCard ? appliedGiftCard.amount : 0;
  const finalTotal = Math.max(0, intermediateTotal - giftCardAmount);

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-300">
       <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Payment</h2>
       
       <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Left Column: Payment Methods */}
          <div className="md:w-1/3 space-y-2">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Pay With</h3>
              
              {isB2BMode && (
                  <button onClick={() => setPaymentMethod('CORPORATE_BILL')} className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 ${paymentMethod === 'CORPORATE_BILL' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-transparent hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                      <Building2 className={`h-5 w-5 mr-3 ${paymentMethod === 'CORPORATE_BILL' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                      Bill to Company
                      {paymentMethod === 'CORPORATE_BILL' && <CheckCircle className="h-4 w-4 ml-auto text-blue-600 dark:text-blue-400" />}
                  </button>
              )}

              {[{ id: 'UPI', label: 'UPI', icon: QrCode }, { id: 'CARD', label: 'Card', icon: CreditCard }, { id: 'WALLET', label: 'Wallets', icon: Wallet }, { id: 'NETBANKING', label: 'Net Banking', icon: Landmark }, { id: 'PAYLATER', label: 'Pay Later', icon: Clock }].map(m => (
                  <button key={m.id} disabled={finalTotal === 0} onClick={() => setPaymentMethod(m.id as PaymentMethod)} className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 ${paymentMethod === m.id ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 shadow-sm' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-transparent hover:bg-gray-50 dark:hover:bg-slate-700'} ${finalTotal === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <m.icon className={`h-5 w-5 mr-3 ${paymentMethod === m.id ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400'}`} />
                      {m.label}
                      {paymentMethod === m.id && finalTotal > 0 && <CheckCircle className="h-4 w-4 ml-auto text-brand-600 dark:text-brand-400" />}
                  </button>
              ))}
          </div>

          {/* Right Column: Payment Details */}
          <div className="md:w-2/3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm min-h-[300px]">
              {finalTotal === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                      <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Fully Covered!</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">The Gift Card balance covers the entire transaction amount.</p>
                  </div>
              ) : (
                  <>
                      {paymentMethod === 'CORPORATE_BILL' && <div className="animate-in fade-in"><h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center"><Building2 className="h-5 w-5 mr-2 text-blue-600" /> Corporate Billing</h3><div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 mb-4"><div className="flex justify-between items-center mb-2"><span className="text-sm text-gray-600 dark:text-gray-300">Cost Center:</span><span className="font-mono font-bold text-gray-800 dark:text-gray-200">CC-SALES-001</span></div><div className="flex justify-between items-center"><span className="text-sm text-gray-600 dark:text-gray-300">Policy Check:</span><span className={`text-xs font-bold px-2 py-0.5 rounded ${policyViolations.length > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{policyViolations.length > 0 ? 'Violations Found' : 'Passed'}</span></div></div>{policyViolations.length > 0 && (<div className="mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800"><h4 className="text-xs font-bold text-red-700 dark:text-red-400 mb-1">Policy Warnings:</h4><ul className="list-disc list-inside text-xs text-red-600 dark:text-red-300 space-y-1">{policyViolations.map((v, i) => <li key={i}>{v}</li>)}</ul><p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2">{requiresApproval ? "This booking will be sent for manager approval." : "You can proceed, but violations will be logged."}</p></div>)}<p className="text-xs text-gray-500 dark:text-gray-400">Invoice will be sent to <strong>accounts@acme.com</strong> directly.</p></div>}
                      
                      {paymentMethod === 'UPI' && (
                        <div className="animate-in fade-in">
                          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center"><Smartphone className="h-5 w-5 mr-2 text-brand-600" /> UPI Payment</h3>
                          <div className="flex gap-4 mb-6 border-b border-gray-100 dark:border-slate-700">
                            <button onClick={() => setUpiMode('QR')} className={`pb-2 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:border-brand-500 ${upiMode === 'QR' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>Scan QR Code</button>
                            <button onClick={() => setUpiMode('ID')} className={`pb-2 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:border-brand-500 ${upiMode === 'ID' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>Enter UPI ID</button>
                          </div>
                          {upiMode === 'QR' ? (
                            <div className="flex flex-col items-center justify-center py-4">
                              <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm mb-4">
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=oneyatra@upi&pn=OneYatra&am=${finalTotal}&cu=INR`} alt="UPI QR" className="w-40 h-40 opacity-90"/>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Scan with any UPI app (GPay, PhonePe, Paytm)</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <Input label="UPI ID / VPA" type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="e.g. 9876543210@okicici"/>
                              <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs p-3 rounded-lg flex items-start">
                                <ShieldCheck className="h-4 w-4 mr-2 mt-0.5" /> A verification request will be sent to your UPI app.
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {paymentMethod === 'CARD' && (
                          <div className="animate-in fade-in space-y-4">
                              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center"><CreditCard className="h-5 w-5 mr-2 text-brand-600" /> Pay with Card</h3>
                              
                              {savedCards.length > 0 && (
                                  <div className="space-y-2 mb-4">
                                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Saved Cards</p>
                                      {savedCards.map(card => (
                                          <div key={card.id} onClick={() => setSelectedCardId(card.id)} className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${selectedCardId === card.id ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'}`}>
                                              <div className="flex items-center gap-3">
                                                  <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded text-xs font-bold">{card.brand}</div>
                                                  <div>
                                                      <p className="text-sm font-bold text-gray-900 dark:text-white">•••• {card.last4}</p>
                                                      <p className="text-[10px] text-gray-500 dark:text-gray-400">{card.expiry}</p>
                                                  </div>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                {selectedCardId === card.id && (
                                                    <div className="w-20">
                                                        <input type="password" value={savedCardCvv} onChange={e => setSavedCardCvv(e.target.value.slice(0, 4))} placeholder="CVV" className="w-full p-1.5 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-brand-500 outline-none" maxLength={4} onClick={e => e.stopPropagation()} />
                                                    </div>
                                                )}
                                                <button onClick={(e) => onDeleteSavedCard(card.id, e)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                                                  <Trash2 className="h-4 w-4" />
                                                </button>
                                              </div>
                                          </div>
                                      ))}
                                      <button onClick={() => setSelectedCardId('NEW')} className={`w-full p-3 rounded-lg border border-dashed text-sm font-medium transition-all ${selectedCardId === 'NEW' ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500 text-brand-700' : 'border-gray-300 dark:border-slate-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                                          + Use Another Card
                                      </button>
                                  </div>
                              )}

                              {selectedCardId === 'NEW' && (
                                  <div className="animate-in fade-in space-y-3">
                                      <Input label="Card Number" type="text" value={newCard.number} onChange={(e) => setNewCard({...newCard, number: e.target.value.replace(/\D/g,'').slice(0, 16)})} placeholder="0000 0000 0000 0000" />
                                      <div className="grid grid-cols-2 gap-4">
                                          <Input label="Expiry Date" type="text" value={newCard.expiry} onChange={(e) => setNewCard({...newCard, expiry: e.target.value})} placeholder="MM / YY" />
                                          <Input label="CVV" type="password" value={newCard.cvv} onChange={(e) => setNewCard({...newCard, cvv: e.target.value.slice(0, 4)})} placeholder="123" maxLength={3} />
                                      </div>
                                      <Input label="Card Holder Name" type="text" value={newCard.name} onChange={(e) => setNewCard({...newCard, name: e.target.value})} placeholder="Name on card" />
                                      <label className="flex items-center gap-2 cursor-pointer">
                                          <input type="checkbox" checked={saveCardForFuture} onChange={e => setSaveCardForFuture(e.target.checked)} className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                                          <span className="text-xs text-gray-600 dark:text-gray-400">Save this card for faster payments</span>
                                      </label>
                                  </div>
                              )}
                          </div>
                      )}

                      {paymentMethod === 'WALLET' && (
                          <div className="animate-in fade-in space-y-4">
                              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center"><Wallet className="h-5 w-5 mr-2 text-brand-600" /> Wallets</h3>
                              <div className="space-y-3">
                                  <div className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedWallet === 'ONEYATRA' ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'}`} onClick={() => setSelectedWallet('ONEYATRA')}>
                                      <div className="flex justify-between items-center mb-1">
                                          <span className="text-sm font-bold text-gray-900 dark:text-white">OneYatra Wallet</span>
                                          <span className="text-xs font-bold text-brand-600">₹{walletBalance.toLocaleString()}</span>
                                      </div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Fastest checkout with one-click payment.</p>
                                      {walletBalance < finalTotal && (
                                          <p className="text-[10px] text-red-500 mt-2 font-bold">Insufficient balance. Please add money or use another method.</p>
                                      )}
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                      {WALLETS.map(w => (
                                          <button key={w.id} onClick={() => setSelectedWallet(w.id)} className={`p-3 rounded-lg border text-left transition-all ${selectedWallet === w.id ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'}`}>
                                              <div className="flex items-center gap-2">
                                                  <div className="w-6 h-6 rounded bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">{w.icon}</div>
                                                  <span className="text-xs font-bold text-gray-900 dark:text-white">{w.name}</span>
                                              </div>
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      )}

                      {paymentMethod === 'NETBANKING' && (
                          <div className="animate-in fade-in space-y-4">
                              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center"><Landmark className="h-5 w-5 mr-2 text-brand-600" /> Net Banking</h3>
                              <div className="grid grid-cols-2 gap-3 mb-4">
                                  {POPULAR_BANKS.map(b => (
                                      <button key={b.id} onClick={() => setSelectedBank(b.id)} className={`p-3 rounded-lg border text-left transition-all ${selectedBank === b.id ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'}`}>
                                          <div className="flex items-center gap-2">
                                              <span className="text-lg">{b.logo}</span>
                                              <span className="text-xs font-bold text-gray-900 dark:text-white">{b.name}</span>
                                          </div>
                                      </button>
                                  ))}
                              </div>
                              <div className="relative">
                                  <select className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none appearance-none">
                                      <option>Select Other Bank</option>
                                      <option>State Bank of India</option>
                                      <option>HDFC Bank</option>
                                      <option>ICICI Bank</option>
                                      <option>Axis Bank</option>
                                      <option>Kotak Mahindra Bank</option>
                                      <option>IndusInd Bank</option>
                                      <option>Yes Bank</option>
                                  </select>
                                  <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                              </div>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2">Note: A processing fee of ₹20 applies for Net Banking.</p>
                          </div>
                      )}

                      {paymentMethod === 'PAYLATER' && (
                          <div className="animate-in fade-in space-y-4">
                              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center"><Clock className="h-5 w-5 mr-2 text-brand-600" /> Pay Later</h3>
                              <div className="space-y-3">
                                  <div className="p-4 rounded-xl border border-brand-200 bg-brand-50 dark:bg-brand-900/20 dark:border-brand-800">
                                      <div className="flex justify-between items-center mb-2">
                                          <span className="text-sm font-bold text-brand-700 dark:text-brand-400">LazyPay</span>
                                          <span className="text-xs font-bold text-green-600">Eligible</span>
                                      </div>
                                      <p className="text-xs text-gray-600 dark:text-gray-300">Book now and pay within 15 days. No extra cost.</p>
                                  </div>
                                  <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 opacity-60">
                                      <div className="flex justify-between items-center mb-2">
                                          <span className="text-sm font-bold text-gray-900 dark:text-white">Simpl</span>
                                          <span className="text-xs font-bold text-gray-400">Not Eligible</span>
                                      </div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Minimum transaction value ₹2,000 required.</p>
                                  </div>
                              </div>
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-start gap-2">
                                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                                  <p className="text-[10px] text-blue-700 dark:text-blue-400">Pay Later options are subject to credit approval by the provider.</p>
                              </div>
                          </div>
                      )}
                  </>
              )}
          </div>
       </div>

        {/* Payment Errors */}
        {paymentError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm animate-in shake duration-300">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertTriangle className="h-4 w-4" />
              Payment Error
            </div>
            {paymentError}
          </div>
        )}

       <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-xl text-white shadow-xl mb-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex-1">
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Total Amount</div>
              <div className="text-3xl font-bold flex items-center gap-3">
                  ₹{finalTotal.toLocaleString()}
                  {discountAmount > 0 && <span className="text-sm text-green-400 line-through opacity-70">₹{subTotal.toLocaleString()}</span>}
              </div>
              <div className="flex gap-4 mt-2 text-[10px] text-slate-400">
                  <span>Base: ₹{booking.option.price.toLocaleString()}</span>
                  {seatCost > 0 && <span>Seats: ₹{seatCost.toLocaleString()}</span>}
                  {mealCost > 0 && <span>Meals: ₹{mealCost.toLocaleString()}</span>}
                  {specialRequestCost > 0 && <span>Extras: ₹{specialRequestCost.toLocaleString()}</span>}
                  {paymentFee > 0 && <span>Fee: ₹{paymentFee.toLocaleString()}</span>}
              </div>
          </div>
          
          <Button size="lg" className="w-full md:w-auto px-8 py-4 text-lg" onClick={onPay}>
              {requiresApproval ? 'Submit Approval' : finalTotal === 0 ? 'Complete Booking' : `Pay ₹${finalTotal.toLocaleString()}`}
          </Button>
       </div>

       {/* Promo / Gift Card UI */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center"><Tag className="h-4 w-4 mr-2 text-brand-600" /> Promo Code</h4>
                  {appliedDiscount && <button onClick={onRemovePromo} className="text-xs text-red-500 font-bold">Remove</button>}
              </div>
              {appliedDiscount ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 p-2 rounded-lg flex justify-between items-center">
                      <span className="text-xs font-bold text-green-700 dark:text-green-400">{appliedDiscount.code}</span>
                      <span className="text-xs font-bold text-green-700 dark:text-green-400">-₹{appliedDiscount.amount}</span>
                  </div>
              ) : (
                  <div className="flex gap-2">
                      <input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="Enter Code" className="flex-1 p-2 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-brand-500 outline-none" />
                      <Button size="sm" onClick={onApplyPromo} disabled={!promoCode || promoStatus === 'VALIDATING'}>{promoStatus === 'VALIDATING' ? '...' : 'Apply'}</Button>
                  </div>
              )}
              {promoMessage && <p className={`text-[10px] mt-1 ${promoStatus === 'ERROR' ? 'text-red-500' : 'text-green-600'}`}>{promoMessage}</p>}
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center"><Gift className="h-4 w-4 mr-2 text-brand-600" /> Gift Card</h4>
                  {appliedGiftCard && <button onClick={onRemoveGiftCard} className="text-xs text-red-500 font-bold">Remove</button>}
              </div>
              {appliedGiftCard ? (
                  <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 p-2 rounded-lg flex justify-between items-center">
                      <span className="text-xs font-bold text-brand-700 dark:text-brand-400">Applied</span>
                      <span className="text-xs font-bold text-brand-700 dark:text-brand-400">-₹{appliedGiftCard.amount}</span>
                  </div>
              ) : (
                  <div className="flex gap-2">
                      <input type="text" value={giftCardCode} onChange={e => setGiftCardCode(e.target.value.toUpperCase())} placeholder="Gift Card #" className="flex-1 p-2 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-brand-500 outline-none" />
                      <Button size="sm" onClick={onApplyGiftCard} disabled={!giftCardCode || giftCardStatus === 'VALIDATING'}>{giftCardStatus === 'VALIDATING' ? '...' : 'Apply'}</Button>
                  </div>
              )}
              {giftCardMessage && <p className={`text-[10px] mt-1 ${giftCardStatus === 'ERROR' ? 'text-red-500' : 'text-green-600'}`}>{giftCardMessage}</p>}
          </div>
       </div>

       <div className="flex items-center justify-center gap-2 text-gray-400 text-[10px] uppercase tracking-widest">
          <Lock className="h-3 w-3" /> Secure 256-bit SSL Encrypted Payment
       </div>
    </div>
  );
};
