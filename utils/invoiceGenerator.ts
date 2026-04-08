
import { jsPDF } from 'jspdf';
import { Booking } from '../types';

export const generateInvoicePDF = async (booking: Booking) => {
  console.log('generateInvoicePDF started for booking:', booking.id);
  try {
    const doc = new jsPDF();
    console.log('jsPDF instance created');
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235); // brand-600
    doc.text('OneYatra', 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('Your Smart Travel Companion', 20, 26);
    
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('INVOICE', 150, 20);
    
    doc.setFontSize(10);
    doc.text(`Invoice No: INV-${booking.id.slice(-6).toUpperCase()}`, 150, 26);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 32);
    
    // Divider
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(20, 40, 190, 40);
    
    // Booking Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Booking Details', 20, 50);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`PNR: ${booking.pnr || 'N/A'}`, 20, 58);
    doc.text(`Mode: ${booking.option.mode}`, 20, 64);
    doc.text(`Provider: ${booking.option.provider}`, 20, 70);
    doc.text(`Travel Date: ${booking.travelDate || 'N/A'}`, 20, 76);
    
    doc.text(`From: ${booking.origin || 'N/A'}`, 110, 58);
    doc.text(`To: ${booking.destination || 'N/A'}`, 110, 64);
    doc.text(`Departure: ${booking.option.departureTime}`, 110, 70);
    
    // Passengers
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Passengers', 20, 90);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    booking.passengers.forEach((p, i) => {
      doc.text(`${i + 1}. ${p.name} (${p.gender}, ${p.age} yrs)`, 20, 98 + (i * 6));
    });
    
    // Payment Summary
    const startY = 110 + (booking.passengers.length * 6);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Summary', 20, startY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Base Fare:', 20, startY + 8);
    doc.text(`₹${(booking.totalAmount + (booking.discount?.amount || 0)).toLocaleString()}`, 150, startY + 8, { align: 'right' });
    
    if (booking.discount) {
      doc.setTextColor(22, 163, 74); // green-600
      doc.text(`Discount (${booking.discount.code}):`, 20, startY + 14);
      doc.text(`- ₹${booking.discount.amount.toLocaleString()}`, 150, startY + 14, { align: 'right' });
      doc.setTextColor(30, 41, 59);
    }
    
    doc.setDrawColor(226, 232, 240);
    doc.line(20, startY + 18, 190, startY + 18);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Total Paid:', 20, startY + 24);
    doc.text(`₹${booking.totalAmount.toLocaleString()}`, 150, startY + 24, { align: 'right' });
    
    // Footer
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('This is a computer generated invoice and does not require a signature.', 105, 280, { align: 'center' });
    doc.text('OneYatra - Your Smart Travel Companion', 105, 285, { align: 'center' });
    
    // Save
    console.log('Attempting to save PDF...');
    const fileName = `OneYatra_Invoice_${booking.id.slice(-6)}.pdf`;
    
    // Use a more robust way to trigger download in iframes
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('PDF download triggered via blob URL');
  } catch (error) {
    console.error('Error in generateInvoicePDF:', error);
    throw error;
  }
};
