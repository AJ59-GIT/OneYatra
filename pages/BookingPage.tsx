
// ... existing imports ...
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { TravelOption, Passenger, Booking, Meal, SpecialRequestOption, SavedCard, SavedTraveler, UserDocument } from '../types';
import { createBooking, processPayment, confirmProviderBooking } from '../services/bookingService';
import { getCurrentUser } from '../services/authService';
import { getWalletBalance, payWithWallet } from '../services/walletService';
import { sendBookingConfirmation, sendBookingSMS } from '../services/notificationService';
import { useSettings } from '../contexts/SettingsContext';
import { checkPolicyCompliance, submitForApproval } from '../services/corporateService';
import { validateGiftCard, redeemGiftCard } from '../services/giftCardService';
import { getDocuments } from '../services/documentService'; 
import { validateIdNumber, IdDocType } from '../utils/idValidation';
import { BookingReview } from '../components/booking/BookingReview';
import { BookingSeatSelection } from '../components/booking/BookingSeatSelection';
import { BookingMealSelection } from '../components/booking/BookingMealSelection';
import { BookingSpecialRequests } from '../components/booking/BookingSpecialRequests';
import { BookingPayment } from '../components/booking/BookingPayment';
import { BookingStatus } from '../components/booking/BookingStatus';

interface BookingPageProps {
  option: TravelOption;
  origin: string;
  destination: string;
  passengersCount: number;
  onBack: () => void;
  onComplete: () => void;
}

type Step = 'REVIEW' | 'SEAT_SELECTION' | 'MEAL_SELECTION' | 'SPECIAL_REQUESTS' | 'PAYMENT' | 'PROCESSING' | 'CONFIRMED' | 'FAILED' | 'PENDING_APPROVAL';
type PaymentMethod = 'UPI' | 'CARD' | 'WALLET' | 'NETBANKING' | 'PAYLATER' | 'CORPORATE_BILL';

const PROMO_CODES: Record<string, { type: 'FLAT' | 'PERCENT', value: number, minAmount: number, maxDiscount?: number }> = {
  'WELCOME50': { type: 'FLAT', value: 50, minAmount: 500 },
  'YATRA10': { type: 'PERCENT', value: 10, minAmount: 1000, maxDiscount: 200 },
  'SAVE100': { type: 'FLAT', value: 100, minAmount: 1500 },
  'SUMMER20': { type: 'PERCENT', value: 20, minAmount: 2000, maxDiscount: 500 }
};

export const BookingPage = ({ option, origin, destination, passengersCount, onBack, onComplete }: BookingPageProps) => {
  // ... existing state and logic ...
  const { isB2BMode } = useSettings();
  const [step, setStep] = useState<Step>('REVIEW');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [processingStatus, setProcessingStatus] = useState('');
  
  // Passenger Form State
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedTravelers, setSavedTravelers] = useState<SavedTraveler[]>([]);
  
  // Vault Integration
  const [vaultDocs, setVaultDocs] = useState<UserDocument[]>([]);
  const [activeVaultIndex, setActiveVaultIndex] = useState<number | null>(null); 

  // Add-on State
  const [selectedSeats, setSelectedSeats] = useState<any[]>([]);
  const [seatCost, setSeatCost] = useState(0);
  
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [mealSpecialRequest, setMealSpecialRequest] = useState('');
  const [mealCost, setMealCost] = useState(0);

  // Special Request State
  const [selectedRequests, setSelectedRequests] = useState<SpecialRequestOption[]>([]);
  const [specialRequestNotes, setSpecialRequestNotes] = useState('');
  const [specialRequestCost, setSpecialRequestCost] = useState(0);

  // Cancellation Policy State
  const [isPolicyExpanded, setIsPolicyExpanded] = useState(false);

  // Promo Code State
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{code: string, amount: number} | null>(null);
  const [promoStatus, setPromoStatus] = useState<'IDLE' | 'VALIDATING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [promoMessage, setPromoMessage] = useState('');
  const [isPromoOpen, setIsPromoOpen] = useState(false);

  // Gift Card State
  const [giftCardCode, setGiftCardCode] = useState('');
  const [appliedGiftCard, setAppliedGiftCard] = useState<{code: string, amount: number} | null>(null);
  const [giftCardStatus, setGiftCardStatus] = useState<'IDLE' | 'VALIDATING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [giftCardMessage, setGiftCardMessage] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(isB2BMode ? 'CORPORATE_BILL' : 'UPI');
  const [upiMode, setUpiMode] = useState<'QR' | 'ID'>('QR');
  const [upiId, setUpiId] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('ONEYATRA');
  const [selectedBank, setSelectedBank] = useState('HDFC');
  
  // Wallet State
  const [walletBalance, setWalletBalance] = useState(0);

  // Saved Cards State
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('NEW'); // 'NEW' or card ID
  const [saveCardForFuture, setSaveCardForFuture] = useState(false);
  const [newCard, setNewCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [savedCardCvv, setSavedCardCvv] = useState('');

  // Corporate Checks
  const [policyViolations, setPolicyViolations] = useState<string[]>([]);
  const [requiresApproval, setRequiresApproval] = useState(false);

  // ... (useEffect for init) ...
  useEffect(() => {
    const user = getCurrentUser();
    
    // Load Wallet Balance
    setWalletBalance(getWalletBalance());

    // Load Vault
    setVaultDocs(getDocuments());

    // Load Saved Travelers from Profile
    let availableSaved: SavedTraveler[] = [];
    if (user && user.savedTravelers) {
        availableSaved = user.savedTravelers;
        setSavedTravelers(availableSaved);
    }

    // Auto-fill logic
    const initialPassengers: Passenger[] = Array(passengersCount).fill(null).map(() => ({
      name: '',
      age: '',
      gender: '',
      idType: '',
      idNumber: ''
    }));

    let filledCount = 0;

    // 1. Auto-fill Self first if available (Primary User)
    if (user && filledCount < passengersCount) {
        initialPassengers[0] = {
            name: user.name,
            age: user.dob ? String(new Date().getFullYear() - new Date(user.dob).getFullYear()) : '', // Rough calc
            gender: user.gender || '',
            idType: '', 
            idNumber: '' 
        };
        filledCount++;
    }

    // 2. Auto-fill Defaults from Saved Travelers
    if (availableSaved.length > 0) {
        const defaults = availableSaved.filter(t => t.isDefault && t.name !== user?.name);
        defaults.forEach(def => {
            if (filledCount < passengersCount) {
                initialPassengers[filledCount] = {
                    name: def.name,
                    age: def.age,
                    gender: def.gender,
                    idType: def.idType,
                    idNumber: def.idNumber
                };
                filledCount++;
            }
        });
    }
    
    setPassengers(initialPassengers);

    // Load saved cards
    const cards = localStorage.getItem('oneyatra_saved_cards');
    if (cards) {
      try {
        const parsed = JSON.parse(cards);
        setSavedCards(parsed);
        // Default to first saved card if available
        if (parsed.length > 0) setSelectedCardId(parsed[0].id);
      } catch(e) {}
    }

    // Load last used payment method
    const lastMethod = localStorage.getItem('oneyatra_last_payment_method');
    if (lastMethod && ['UPI', 'CARD', 'WALLET', 'NETBANKING', 'PAYLATER'].includes(lastMethod) && !isB2BMode) {
      setPaymentMethod(lastMethod as PaymentMethod);
    }
  }, [passengersCount, isB2BMode]);

  useEffect(() => {
      if (isB2BMode) {
          const compliance = checkPolicyCompliance(option.price, option.mode, new Date().toISOString());
          setPolicyViolations(compliance.violations);
          setRequiresApproval(compliance.requiresApproval);
          setPaymentMethod('CORPORATE_BILL');
      }
  }, [isB2BMode, option]);

  // ... (getCancellationPolicy helper) ...
  const getCancellationPolicy = () => {
    const mode = option.mode;
    let tiers = [];
    let freeCancelText = "";
    let description = "";

    switch(mode) {
        case 'BUS':
            tiers = [
                { label: 'More than 24 hrs before', refund: 100, color: 'text-green-600', bg: 'bg-green-600' },
                { label: '12 to 24 hrs before', refund: 50, color: 'text-yellow-600', bg: 'bg-yellow-500' },
                { label: 'Less than 12 hrs', refund: 0, color: 'text-red-600', bg: 'bg-red-500' },
            ];
            freeCancelText = "Free Cancellation until 24 hrs before departure";
            description = "Standard bus operator cancellation policy. Refunds are processed to the original payment method.";
            break;
        case 'FLIGHT':
             tiers = [
                { label: 'More than 7 days before', refund: 90, color: 'text-green-600', bg: 'bg-green-600' },
                { label: '24 hrs to 7 days', refund: 50, color: 'text-yellow-600', bg: 'bg-yellow-500' },
                { label: 'Less than 24 hrs', refund: 0, color: 'text-red-600', bg: 'bg-red-500' },
            ];
            freeCancelText = "Free Cancellation up to 7 days prior";
            description = "Airline penalties apply. Convenience fees are non-refundable. Amount shown is excluding taxes.";
            break;
        case 'TRAIN':
             tiers = [
                { label: 'Confirmed (> 48 hrs)', refund: 95, color: 'text-green-600', bg: 'bg-green-600' },
                { label: 'Confirmed (12-48 hrs)', refund: 75, color: 'text-yellow-600', bg: 'bg-yellow-500' },
                { label: 'Less than 4 hrs', refund: 0, color: 'text-red-600', bg: 'bg-red-500' },
            ];
            freeCancelText = "Minimal charges up to 48 hrs before";
            description = "As per IRCTC refund rules. Tatkal tickets are non-refundable.";
            break;
        default: // CAB, MIXED
             tiers = [
                { label: 'More than 1 hr before', refund: 100, color: 'text-green-600', bg: 'bg-green-600' },
                { label: 'Less than 1 hr', refund: 0, color: 'text-red-600', bg: 'bg-red-500' },
            ];
            freeCancelText = "Free Cancellation until 1 hour before pickup";
            description = "You can cancel for free until a driver is assigned or up to 1 hour before pickup time.";
            break;
    }
    return { tiers, freeCancelText, description };
  };

  // ... (Handlers) ...
  const handleSeatsConfirmed = (seats: any[]) => {
    setSelectedSeats(seats);
    const extra = seats.reduce((sum, s) => sum + s.price, 0);
    setSeatCost(extra);
    setStep('MEAL_SELECTION');
  };

  const handleSeatsSkipped = () => {
    setSeatCost(0);
    setSelectedSeats([]);
    setStep('MEAL_SELECTION');
  };

  const handleMealConfirmed = (meal: Meal | null, specialRequests: string) => {
    setSelectedMeal(meal);
    const cost = meal ? meal.price * passengersCount : 0;
    setMealCost(cost);
    setStep('SPECIAL_REQUESTS');
  };

  const handleSpecialRequestsConfirmed = (requests: SpecialRequestOption[], notes: string) => {
    setSelectedRequests(requests);
    setSpecialRequestNotes(notes);
    const cost = requests.reduce((sum, req) => sum + req.price, 0);
    setSpecialRequestCost(cost);
    handleStartPayment(seatCost + mealCost + cost);
  };

  const handleStartPayment = (totalExtras = 0) => {
    const currentExtras = seatCost + mealCost + specialRequestCost;
    const finalExtras = totalExtras || currentExtras;
    const finalPrice = option.price + finalExtras;
    
    const newBooking = createBooking({ ...option, price: finalPrice }, passengers);
    newBooking.selectedSeats = selectedSeats;
    newBooking.selectedMeal = selectedMeal;
    
    let combinedNotes = specialRequestNotes;
    if (mealSpecialRequest) {
        combinedNotes = combinedNotes ? `Meal: ${mealSpecialRequest}. ${combinedNotes}` : `Meal: ${mealSpecialRequest}`;
    }
    newBooking.specialRequests = combinedNotes;
    newBooking.selectedAddOns = selectedRequests;
    newBooking.origin = origin;
    newBooking.destination = destination;
    newBooking.isCorporate = isB2BMode;

    if (isB2BMode) {
        const compliance = checkPolicyCompliance(finalPrice, option.mode, new Date().toISOString());
        newBooking.policyViolations = compliance.violations;
        setPolicyViolations(compliance.violations);
        setRequiresApproval(compliance.requiresApproval);
    }

    setBooking(newBooking);
    setStep('PAYMENT');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    passengers.forEach((p, idx) => {
      if (!p.name.trim()) { newErrors[`name_${idx}`] = 'Name is required'; isValid = false; }
      const ageNum = Number(p.age);
      if (!p.age || isNaN(ageNum) || ageNum <= 0 || ageNum > 120) { 
        newErrors[`age_${idx}`] = 'Please enter a valid age (1-120)'; 
        isValid = false; 
      }
      if (!p.gender) { newErrors[`gender_${idx}`] = 'Gender is required'; isValid = false; }
      if (['FLIGHT', 'TRAIN'].includes(option.mode)) {
         if(!p.idType) {
           newErrors[`idType_${idx}`] = 'ID Type required';
           isValid = false;
         }
         if(!p.idNumber) {
           newErrors[`idNumber_${idx}`] = 'ID Number required';
           isValid = false;
         } else {
           const validation = validateIdNumber(p.idType as IdDocType, p.idNumber);
           if (!validation.isValid) {
             newErrors[`idNumber_${idx}`] = validation.error || 'Invalid ID format';
             isValid = false;
           }
         }
      }
    });

    setErrors(newErrors);
    
    if (!isValid) {
      const firstErrorKey = Object.keys(newErrors)[0];
      if (firstErrorKey) {
        const idx = parseInt(firstErrorKey.split('_')[1]);
        setExpandedIndex(idx);
      }
    }
    return isValid;
  };

  const handleApplyPromo = async () => {
    const subTotal = option.price + seatCost + mealCost + specialRequestCost;
    if (!promoCode.trim()) return;
    setPromoStatus('VALIDATING');
    setPromoMessage('');
    await new Promise(r => setTimeout(r, 800));
    const code = promoCode.trim().toUpperCase();
    const promo = PROMO_CODES[code];
    if (promo) {
        if (subTotal >= promo.minAmount) {
            let amount = promo.type === 'FLAT' ? promo.value : (subTotal * promo.value / 100);
            if (promo.maxDiscount) amount = Math.min(amount, promo.maxDiscount);
            amount = Math.floor(amount);
            setAppliedDiscount({ code, amount });
            setPromoStatus('SUCCESS');
            setPromoMessage(`Saved ₹${amount}`);
        } else {
            setPromoStatus('ERROR');
            setPromoMessage(`Add ₹${promo.minAmount - subTotal} more to apply`);
        }
    } else {
        setPromoStatus('ERROR');
        setPromoMessage('Invalid or expired promo code');
    }
  };

  const handleApplyGiftCard = async () => {
      const subTotal = option.price + seatCost + mealCost + specialRequestCost;
      const discountAmount = appliedDiscount ? appliedDiscount.amount : 0;
      let paymentFee = paymentMethod === 'NETBANKING' ? 20 : 0;
      const currentTotal = Math.max(0, subTotal - discountAmount + paymentFee);

      if (!giftCardCode.trim()) return;
      setGiftCardStatus('VALIDATING');
      setGiftCardMessage('');
      
      const result = await validateGiftCard(giftCardCode.trim());
      if (result.isValid && result.card) {
          const usableAmount = Math.min(result.card.balance, currentTotal);
          setAppliedGiftCard({ code: result.card.code, amount: usableAmount });
          setGiftCardStatus('SUCCESS');
          setGiftCardMessage(`Redeeming ₹${usableAmount} from Gift Card`);
      } else {
          setGiftCardStatus('ERROR');
          setGiftCardMessage(result.message || 'Invalid Gift Card');
      }
  };

  const handleRemovePromo = () => { setAppliedDiscount(null); setPromoCode(''); setPromoStatus('IDLE'); setPromoMessage(''); };
  const handleRemoveGiftCard = () => { setAppliedGiftCard(null); setGiftCardCode(''); setGiftCardStatus('IDLE'); setGiftCardMessage(''); };
  
  const handleDeleteSavedCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this saved card?")) return;
    const updated = savedCards.filter(c => c.id !== id);
    setSavedCards(updated);
    localStorage.setItem('oneyatra_saved_cards', JSON.stringify(updated));
    if (selectedCardId === id) setSelectedCardId('NEW');
  };

  const saveNewCard = () => {
    const last4 = newCard.number.slice(-4);
    const brand = newCard.number.startsWith('4') ? 'Visa' : newCard.number.startsWith('5') ? 'MasterCard' : 'Card';
    const newSaved: SavedCard = {
        id: `card_${Date.now()}`,
        brand,
        last4: last4 || '0000',
        expiry: newCard.expiry,
        holderName: newCard.name,
        token: `tok_${Math.random().toString(36).substr(2)}`
    };
    const updated = [...savedCards, newSaved];
    setSavedCards(updated);
    localStorage.setItem('oneyatra_saved_cards', JSON.stringify(updated));
  };

  const handlePay = async () => {
    if (!booking) return;
    const subTotal = option.price + seatCost + mealCost + specialRequestCost;
    const discountAmount = appliedDiscount ? appliedDiscount.amount : 0;
    let paymentFee = 0;
    if (paymentMethod === 'NETBANKING') paymentFee = 20;
    const intermediateTotal = Math.max(0, subTotal - discountAmount + paymentFee);
    const giftCardAmount = appliedGiftCard ? appliedGiftCard.amount : 0;
    const finalAmount = Math.max(0, intermediateTotal - giftCardAmount);

    if (isB2BMode && requiresApproval) {
        if (!window.confirm("This booking violates corporate policy. Submit for approval?")) return;
        submitForApproval(booking, policyViolations);
        setStep('PENDING_APPROVAL');
        return;
    }

    if (finalAmount > 0) {
        if (paymentMethod === 'UPI' && upiMode === 'ID' && !upiId.includes('@')) {
            setPaymentError('Please enter a valid UPI ID'); return;
        }
        if (paymentMethod === 'CARD' && selectedCardId === 'NEW' && (!newCard.number || !newCard.expiry || !newCard.cvv)) {
            setPaymentError("Please enter full card details"); return;
        }
        if (paymentMethod === 'CARD' && selectedCardId !== 'NEW' && (!savedCardCvv || savedCardCvv.length < 3)) {
            setPaymentError("Please enter CVV"); return;
        }
        if (paymentMethod === 'WALLET' && selectedWallet === 'ONEYATRA' && walletBalance < finalAmount) {
            setPaymentError(`Insufficient Balance. Need ₹${finalAmount - walletBalance} more.`); return;
        }
    }

    setPaymentError(null);
    booking.totalAmount = finalAmount + giftCardAmount;
    if (appliedDiscount) booking.discount = appliedDiscount;
    if (appliedGiftCard) booking.giftCardRedemption = appliedGiftCard;

    localStorage.setItem('oneyatra_last_payment_method', paymentMethod);
    setStep('PROCESSING');
    setProcessingStatus(finalAmount > 0 ? `Securely contacting ${paymentMethod}...` : 'Finalizing Booking...');
    
    let paymentSuccess = true;
    if (appliedGiftCard) {
        const gcSuccess = await redeemGiftCard(appliedGiftCard.code, appliedGiftCard.amount);
        if (!gcSuccess) { setPaymentError("Gift Card Error"); setStep('PAYMENT'); return; }
    }
    
    if (finalAmount > 0) {
        if (paymentMethod === 'WALLET' && selectedWallet === 'ONEYATRA') paymentSuccess = await payWithWallet(finalAmount, booking.id);
        else if (paymentMethod === 'CORPORATE_BILL') { await new Promise(r => setTimeout(r, 1000)); paymentSuccess = true; }
        else paymentSuccess = await processPayment(booking.id);
    }
    
    if (!paymentSuccess) { setStep('FAILED'); return; }

    setProcessingStatus(`Confirming with ${option.provider}...`);
    const finalBooking = await confirmProviderBooking(booking.id);
    finalBooking.totalAmount = finalAmount + giftCardAmount; 
    finalBooking.discount = appliedDiscount || undefined;
    finalBooking.giftCardRedemption = appliedGiftCard || undefined;
    setBooking({...finalBooking});

    if (finalBooking.status === 'CONFIRMED') {
      setStep('CONFIRMED');
      const user = getCurrentUser();
      if(user && user.email) {
          sendBookingConfirmation(finalBooking, user.email);
          const phone = user.phone || '9876543210';
          sendBookingSMS(finalBooking, phone);
      }
    } else {
      setStep('FAILED');
    }
  };

  const updatePassenger = (index: number, field: keyof Passenger, value: any) => {
    const newPassengers = [...passengers];
    newPassengers[index] = { ...newPassengers[index], [field]: value };
    setPassengers(newPassengers);
    if (errors[`${field}_${index}`]) {
      const newErrors = { ...errors };
      delete newErrors[`${field}_${index}`];
      setErrors(newErrors);
    }
  };

  const fillFromVault = (doc: UserDocument) => {
      if (activeVaultIndex === null) return;
      
      const idx = activeVaultIndex;
      const newPassengers = [...passengers];
      
      newPassengers[idx].name = doc.holderName;
      newPassengers[idx].gender = doc.gender || '';
      newPassengers[idx].idType = doc.type;
      newPassengers[idx].idNumber = doc.number;
      
      if (doc.dob) {
          const birthYear = new Date(doc.dob).getFullYear();
          const currentYear = new Date().getFullYear();
          newPassengers[idx].age = String(currentYear - birthYear);
      }

      setPassengers(newPassengers);
      setActiveVaultIndex(null);
  };

  const inputClasses = "col-span-1 border border-gray-300 dark:border-slate-600 rounded-lg p-3 text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors";

  const handleProceedFromReview = () => {
    const newErrors: Record<string, string> = {};
    passengers.forEach((p, i) => {
      if (!p.name) newErrors[`name_${i}`] = 'Name is required';
      const ageNum = Number(p.age);
      if (!p.age || isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
        newErrors[`age_${i}`] = 'Valid age required (1-120)';
      }
      if (!p.gender) newErrors[`gender_${i}`] = 'Gender is required';
      
      if ((option.mode === 'FLIGHT' || option.mode === 'TRAIN')) {
        if (!p.idType) newErrors[`idType_${i}`] = 'ID type required';
        if (!p.idNumber) newErrors[`idNumber_${i}`] = 'ID number required';
        else {
          const v = validateIdNumber(p.idType as IdDocType, p.idNumber);
          if (!v.isValid) newErrors[`idNumber_${i}`] = v.error || 'Invalid format';
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.keys(newErrors)[0];
      const index = parseInt(firstError.split('_')[1]);
      setExpandedIndex(index);
      return;
    }

    setErrors({});
    if (option.mode === 'CAB') setStep('SPECIAL_REQUESTS');
    else setStep('SEAT_SELECTION');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {step !== 'CONFIRMED' && step !== 'FAILED' && step !== 'PENDING_APPROVAL' && (
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-brand-600 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Search
        </button>
      )}

      {step === 'REVIEW' && (
        <BookingReview 
          option={option}
          origin={origin}
          destination={destination}
          passengersCount={passengersCount}
          passengers={passengers}
          expandedIndex={expandedIndex}
          setExpandedIndex={setExpandedIndex}
          errors={errors}
          savedTravelers={savedTravelers}
          vaultDocs={vaultDocs}
          activeVaultIndex={activeVaultIndex}
          setActiveVaultIndex={setActiveVaultIndex}
          isPolicyExpanded={isPolicyExpanded}
          setIsPolicyExpanded={setIsPolicyExpanded}
          updatePassenger={updatePassenger}
          fillFromVault={fillFromVault}
          getCancellationPolicy={getCancellationPolicy}
          onProceed={handleProceedFromReview}
        />
      )}

      {step === 'SEAT_SELECTION' && (
        <BookingSeatSelection 
          mode={option.mode}
          passengersCount={passengersCount}
          onConfirmed={handleSeatsConfirmed}
          onSkipped={handleSeatsSkipped}
          basePrice={option.price}
        />
      )}

      {step === 'MEAL_SELECTION' && (
        <BookingMealSelection 
          passengers={passengers}
          onConfirmed={handleMealConfirmed}
          onSkipped={() => setStep('SPECIAL_REQUESTS')}
          currency={option.currency}
        />
      )}

      {step === 'SPECIAL_REQUESTS' && (
        <BookingSpecialRequests 
          mode={option.mode}
          onConfirmed={handleSpecialRequestsConfirmed}
          onSkipped={() => setStep('PAYMENT')}
        />
      )}

      {step === 'PAYMENT' && booking && (
        <BookingPayment 
          booking={booking}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          upiMode={upiMode}
          setUpiMode={setUpiMode}
          upiId={upiId}
          setUpiId={setUpiId}
          selectedWallet={selectedWallet}
          setSelectedWallet={setSelectedWallet}
          selectedBank={selectedBank}
          setSelectedBank={setSelectedBank}
          walletBalance={walletBalance}
          savedCards={savedCards}
          selectedCardId={selectedCardId}
          setSelectedCardId={setSelectedCardId}
          saveCardForFuture={saveCardForFuture}
          setSaveCardForFuture={setSaveCardForFuture}
          newCard={newCard}
          setNewCard={setNewCard}
          savedCardCvv={savedCardCvv}
          setSavedCardCvv={setSavedCardCvv}
          promoCode={promoCode}
          setPromoCode={setPromoCode}
          appliedDiscount={appliedDiscount}
          promoStatus={promoStatus}
          promoMessage={promoMessage}
          isPromoOpen={isPromoOpen}
          setIsPromoOpen={setIsPromoOpen}
          giftCardCode={giftCardCode}
          setGiftCardCode={setGiftCardCode}
          appliedGiftCard={appliedGiftCard}
          giftCardStatus={giftCardStatus}
          giftCardMessage={giftCardMessage}
          paymentError={paymentError}
          isB2BMode={isB2BMode}
          requiresApproval={requiresApproval}
          policyViolations={policyViolations}
          onApplyPromo={handleApplyPromo}
          onRemovePromo={handleRemovePromo}
          onApplyGiftCard={handleApplyGiftCard}
          onRemoveGiftCard={handleRemoveGiftCard}
          onDeleteSavedCard={handleDeleteSavedCard}
          onPay={handlePay}
          subTotal={option.price + seatCost + mealCost + specialRequestCost}
          seatCost={seatCost}
          mealCost={mealCost}
          specialRequestCost={specialRequestCost}
        />
      )}

      {['PROCESSING', 'CONFIRMED', 'FAILED', 'PENDING_APPROVAL'].includes(step) && (
        <BookingStatus 
          step={step as any}
          booking={booking}
          processingStatus={processingStatus}
          onComplete={onComplete}
        />
      )}
    </div>
  );
};

export default BookingPage;

