import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import Confetti from "react-confetti";
import { motion } from "framer-motion";
import { CheckCircle, Printer, Download, Home, Sparkles, User, Phone, MapPin } from "lucide-react";
import { useOrder } from "@/hooks/use-orders";
import { useProduct } from "@/hooks/use-products";
import { Layout } from "@/components/Layout";
import { Button, Card } from "@/components/ui-custom";

export default function Bill() {
  const { id } = useParams();
  const orderId = parseInt(id || "0");
  const { data: order, isLoading: isOrderLoading } = useOrder(orderId);
  const { data: product, isLoading: isProductLoading } = useProduct(order?.productId || 0);
  
  const [showConfetti, setShowConfetti] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  if (isOrderLoading || (order && isProductLoading)) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto w-full mt-10 animate-pulse space-y-6">
          <div className="h-64 bg-white/5 rounded-3xl" />
        </div>
      </Layout>
    );
  }

  if (!order || !product) {
    return (
      <Layout>
        <div className="p-12 text-center bg-red-500/10 rounded-3xl mt-10">
          <h2 className="text-2xl font-display text-red-400 mb-4">Invoice Not Found</h2>
        </div>
      </Layout>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout>
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} colors={['#FF4B1F', '#FF9068', '#FFD700', '#FFFFFF']} />}
      
      <div className="max-w-3xl mx-auto w-full pt-8 pb-16">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-500 mb-4 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-display text-white tracking-widest mb-2">ORDER CONFIRMED</h1>
          <p className="text-muted-foreground text-lg">Thank you for your purchase. Your celebration is about to begin!</p>
        </motion.div>

        {/* Invoice Card */}
        <Card className="bg-white text-black p-8 md:p-12 relative overflow-hidden print:shadow-none print:border-0 rounded-none md:rounded-2xl">
          {/* Watermark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
            <Sparkles className="w-96 h-96" />
          </div>
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-gray-200 pb-8 mb-8 gap-6">
            <div>
              <h2 className="text-3xl font-display text-red-600 tracking-wider mb-1 flex items-center gap-2">
                <Sparkles className="w-6 h-6" /> S K CRACKERS
              </h2>
              <p className="text-sm text-gray-500 italic mb-1">Light up your celebrations!</p>
              <p className="text-sm text-gray-500">GSTIN: 33ABCDE1234F1Z5</p>
            </div>
            <div className="text-left sm:text-right">
              <h3 className="text-xl font-bold text-gray-800 mb-1">TAX INVOICE</h3>
              <p className="text-sm font-semibold text-gray-600">Order #{order.id.toString().padStart(6, '0')}</p>
              <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString('en-IN')}</p>
            </div>
          </div>

          {/* Billing & Shipping Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-gray-100">
            <div>
              <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-3 flex items-center">
                <User className="w-3 h-3 mr-1" /> Customer Details
              </h4>
              <p className="font-bold text-gray-900">{order.customerName}</p>
              <p className="text-gray-600 flex items-center gap-1 mt-1">
                <Phone className="w-3 h-3" /> {order.customerPhone}
              </p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-3 flex items-center">
                <MapPin className="w-3 h-3 mr-1" /> Delivery Address
              </h4>
              <p className="text-gray-600 leading-relaxed">{order.customerAddress}</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-sm uppercase tracking-wider">
                  <th className="py-3 px-4 rounded-l-lg">Item Description</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Rate</th>
                  <th className="py-3 px-4 text-right rounded-r-lg">Amount</th>
                </tr>
              </thead>
              <tbody className="text-gray-800 divide-y border-gray-200">
                <tr>
                  <td className="py-4 px-4 font-medium">{product.name}</td>
                  <td className="py-4 px-4 text-center">{order.quantity}</td>
                  <td className="py-4 px-4 text-right">₹{Number(product.price).toFixed(2)}</td>
                  <td className="py-4 px-4 text-right">₹{Number(order.subtotal).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex flex-col sm:flex-row justify-between items-end gap-6 pt-4">
            <div className="w-full sm:w-auto bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 mb-1">Payment Method:</p>
              <p className="text-lg text-gray-900 capitalize flex items-center gap-2">
                {order.paymentMethod === 'upi' ? '📱 UPI' : order.paymentMethod === 'card' ? '💳 Card' : '💵 Cash'}
              </p>
            </div>
            
            <div className="w-full sm:w-80 space-y-3 text-gray-700">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold">₹{Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>GST (18%):</span>
                <span>₹{Number(order.gstAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t-2 border-gray-800 pt-3 text-xl font-bold text-black mt-3">
                <span>Grand Total:</span>
                <span className="text-red-600">₹{Number(order.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-center text-sm text-gray-500 font-medium">
            Thank you for shopping with S K Crackers!<br/>
            Wishing you a safe and joyful celebration.
          </div>
        </Card>

        {/* Actions - Hidden on Print */}
        <div className="flex flex-wrap justify-center gap-4 mt-8 print:hidden">
          <Button variant="outline" onClick={handlePrint} className="bg-white/5 border-white/20 text-white hover:bg-white/10">
            <Printer className="w-4 h-4 mr-2" /> Print Invoice
          </Button>
          <Link href="/">
            <Button>
              <Home className="w-4 h-4 mr-2" /> Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
