import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import jsPDF from "jspdf";
import { Download, MessageCircle, Truck, Utensils } from "lucide-react";
import React, { useState, useRef } from "react";
import { toast } from "sonner";
import { useCart } from "../context/CartContext";
import { saveOrder } from "../hooks/useFirebase";
import type { Restaurant } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  restaurant: Restaurant;
}

type Step = "type" | "info" | "summary" | "payment" | "slip";

function generateOrderNo() {
  return `ORD-${Date.now().toString(36).toUpperCase()}`;
}

export function OrderFlow({ open, onClose, restaurant }: Props) {
  const { items, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState<Step>("type");
  const [orderType, setOrderType] = useState<"delivery" | "dinein">("delivery");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [payMethod, setPayMethod] = useState<"online" | "cod">("cod");
  const [utrNo, setUtrNo] = useState("");
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [qrError, setQrError] = useState(false);
  const slipRef = useRef<HTMLDivElement>(null);

  const subtotal = totalPrice;
  const deliveryCharge =
    orderType === "delivery" ? restaurant.deliveryCharge : 0;
  const packingCharge = orderType === "delivery" ? restaurant.packingCharge : 0;
  const platformFee = restaurant.platformFee || 0;
  const grandTotal = subtotal + deliveryCharge + packingCharge + platformFee;

  function validatePhone(v: string) {
    if (!/^[6-9]\d{9}$/.test(v)) {
      setPhoneError("Enter a valid 10-digit Indian mobile number");
      return false;
    }
    setPhoneError("");
    return true;
  }

  function handleClose() {
    setStep("type");
    setName("");
    setAddress("");
    setPhone("");
    setPayMethod("cod");
    setUtrNo("");
    setPlacedOrder(null);
    setQrError(false);
    onClose();
  }

  async function placeOrder() {
    if (payMethod === "online" && utrNo.length < 10) {
      toast.error("Please enter a valid UTR number (min 10 digits)");
      return;
    }
    const orderNo = generateOrderNo();
    const orderData = {
      orderNo,
      customerName: name,
      address: orderType === "delivery" ? address : "Dine In",
      phone,
      orderType,
      items,
      subtotal,
      deliveryCharge,
      packingCharge,
      platformFee,
      total: grandTotal,
      paymentMethod: payMethod,
      utrNo: utrNo || "",
      status: "pending" as const,
      rejectionReason: "",
      timestamp: Date.now(),
      restaurantName: restaurant.name,
      restaurantId: restaurant.id,
    };
    try {
      await saveOrder(restaurant.id, orderData);
      setPlacedOrder({ ...orderData, id: orderNo });
      setStep("slip");
      clearCart();
    } catch {
      toast.error("Failed to place order. Please try again.");
    }
  }

  function shareSlipWhatsApp(order: any) {
    const itemsText = order.items
      .map(
        (i: any) =>
          `• ${i.name}${i.variant ? ` (${i.variant})` : ""} x${i.qty} = Rs.${(i.price * i.qty).toFixed(0)}`,
      )
      .join("\n");
    const lines = [
      "*ORDER RECEIPT*",
      `Restaurant: ${restaurant.name}`,
      `Order No: #${order.orderNo}`,
      `Date: ${new Date(order.timestamp).toLocaleString()}`,
      "",
      `Customer: ${order.customerName}`,
      `Address: ${order.address}`,
      `Phone: ${order.phone}`,
      "",
      "*Items:*",
      itemsText,
      "",
      `Subtotal: Rs.${order.subtotal}`,
      ...(order.deliveryCharge > 0
        ? [`Delivery: Rs.${order.deliveryCharge}`]
        : []),
      ...(order.packingCharge > 0
        ? [`Packing: Rs.${order.packingCharge}`]
        : []),
      ...(order.platformFee > 0
        ? [`Platform Fee: Rs.${order.platformFee}`]
        : []),
      `*TOTAL: Rs.${order.total}*`,
      `Payment: ${order.paymentMethod === "online" ? "Online" : "Cash on Delivery"}`,
    ];
    const msg = lines.join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function downloadSlip() {
    if (!placedOrder) return;
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageW = doc.internal.pageSize.getWidth();
      let y = 20;

      // Header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(placedOrder.restaurantName || restaurant.name, pageW / 2, y, {
        align: "center",
      });
      y += 8;

      if (restaurant.address) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(restaurant.address, pageW / 2, y, { align: "center" });
        y += 6;
      }

      // Divider
      doc.setLineWidth(0.5);
      doc.line(15, y, pageW - 15, y);
      y += 6;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Order No: #${placedOrder.orderNo}`, 15, y);
      y += 6;
      doc.text(
        `Date: ${new Date(placedOrder.timestamp).toLocaleString()}`,
        15,
        y,
      );
      y += 6;
      doc.text(
        `Type: ${placedOrder.orderType === "delivery" ? "Home Delivery" : "Dine In"}`,
        15,
        y,
      );
      y += 6;

      if (placedOrder.orderType === "delivery") {
        doc.text(`Customer: ${placedOrder.customerName}`, 15, y);
        y += 6;
        doc.text(`Address: ${placedOrder.address}`, 15, y);
        y += 6;
        doc.text(`Phone: ${placedOrder.phone}`, 15, y);
        y += 6;
      }

      // Items header
      doc.line(15, y, pageW - 15, y);
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.text("Item", 15, y);
      doc.text("Qty", 120, y);
      doc.text("Amount", 160, y);
      y += 5;
      doc.line(15, y, pageW - 15, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      for (const item of placedOrder.items) {
        const label = item.name + (item.variant ? ` (${item.variant})` : "");
        doc.text(label.substring(0, 40), 15, y);
        doc.text(String(item.qty), 125, y);
        doc.text(`Rs.${(item.price * item.qty).toFixed(0)}`, 160, y);
        y += 6;
      }

      // Totals
      doc.line(15, y, pageW - 15, y);
      y += 6;
      doc.text("Subtotal:", 120, y);
      doc.text(`Rs.${placedOrder.subtotal}`, 160, y);
      y += 6;
      if (placedOrder.deliveryCharge > 0) {
        doc.text("Delivery:", 120, y);
        doc.text(`Rs.${placedOrder.deliveryCharge}`, 160, y);
        y += 6;
      }
      if (placedOrder.packingCharge > 0) {
        doc.text("Packing:", 120, y);
        doc.text(`Rs.${placedOrder.packingCharge}`, 160, y);
        y += 6;
      }
      if (placedOrder.platformFee > 0) {
        doc.text("Platform Fee:", 120, y);
        doc.text(`Rs.${placedOrder.platformFee}`, 160, y);
        y += 6;
      }

      doc.setFont("helvetica", "bold");
      doc.line(15, y, pageW - 15, y);
      y += 6;
      doc.text("TOTAL:", 120, y);
      doc.text(`Rs.${placedOrder.total}`, 160, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.text(
        `Payment: ${placedOrder.paymentMethod === "online" ? "Online Payment" : "Cash on Delivery"}`,
        15,
        y,
      );
      y += 10;

      // Footer
      doc.line(15, y, pageW - 15, y);
      y += 6;
      doc.setFontSize(9);
      doc.text(
        `Thank you for ordering from ${restaurant.name}!`,
        pageW / 2,
        y,
        { align: "center" },
      );
      y += 5;
      if (restaurant.phone) {
        doc.text(`For queries call: ${restaurant.phone}`, pageW / 2, y, {
          align: "center",
        });
      }

      doc.save(`Order-${placedOrder.orderNo}.pdf`);
    } catch (err) {
      console.error(err);
      toast.error("Download failed. Please try again.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
    >
      <DialogContent
        className="max-w-md max-h-[90vh] overflow-y-auto"
        data-ocid="order.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {step === "type" && "How would you like your order?"}
            {step === "info" && "Your Delivery Details"}
            {step === "summary" && "Order Summary"}
            {step === "payment" && "Payment"}
            {step === "slip" && "Order Confirmed! 🎉"}
          </DialogTitle>
        </DialogHeader>

        {step === "type" && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <button
              type="button"
              data-ocid="order.delivery.button"
              onClick={() => {
                setOrderType("delivery");
                setStep("info");
              }}
              className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                orderType === "delivery"
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 hover:border-orange-300"
              }`}
            >
              <Truck size={36} className="text-orange-500" />
              <span className="font-semibold text-gray-800">Home Delivery</span>
              <span className="text-xs text-gray-500 text-center">
                Delivered to your doorstep
              </span>
            </button>
            <button
              type="button"
              data-ocid="order.dinein.button"
              onClick={() => {
                setOrderType("dinein");
                setStep("summary");
              }}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-200 hover:border-orange-300 transition-all"
            >
              <Utensils size={36} className="text-orange-500" />
              <span className="font-semibold text-gray-800">
                Dine In / Serve
              </span>
              <span className="text-xs text-gray-500 text-center">
                Served at your table
              </span>
            </button>
          </div>
        )}

        {step === "info" && (
          <div className="space-y-4 mt-2">
            <div>
              <Label htmlFor="cname">Full Name *</Label>
              <Input
                data-ocid="order.name.input"
                id="cname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="caddr">Delivery Address *</Label>
              <Input
                data-ocid="order.address.input"
                id="caddr"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full address with landmarks"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cphone">Mobile Number *</Label>
              <Input
                data-ocid="order.phone.input"
                id="cphone"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (phoneError) validatePhone(e.target.value);
                }}
                placeholder="10-digit mobile number"
                maxLength={10}
                className={`mt-1 ${phoneError ? "border-red-500" : ""}`}
              />
              {phoneError && (
                <p
                  data-ocid="order.phone.error"
                  className="text-red-500 text-xs mt-1"
                >
                  {phoneError}
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("type")}
                data-ocid="order.back.button"
              >
                Back
              </Button>
              <Button
                data-ocid="order.next.button"
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => {
                  if (!name.trim() || !address.trim()) {
                    toast.error("Please fill all fields");
                    return;
                  }
                  if (!validatePhone(phone)) return;
                  setStep("summary");
                }}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step === "summary" && (
          <div className="mt-2">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 max-h-52 overflow-y-auto mb-4">
              {items.map((item, i) => (
                <div key={String(i)} className="flex justify-between text-sm">
                  <span>
                    {item.name}
                    {item.variant ? ` (${item.variant})` : ""} x {item.qty}
                  </span>
                  <span className="font-semibold">
                    Rs.{(item.price * item.qty).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 border-t pt-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>Rs.{subtotal.toFixed(0)}</span>
              </div>
              {orderType === "delivery" && deliveryCharge > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Delivery Charge</span>
                  <span>Rs.{deliveryCharge}</span>
                </div>
              )}
              {orderType === "delivery" && packingCharge > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Packing Charge</span>
                  <span>Rs.{packingCharge}</span>
                </div>
              )}
              {platformFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Platform Fee</span>
                  <span>Rs.{platformFee}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span className="text-orange-600">
                  Rs.{grandTotal.toFixed(0)}
                </span>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() =>
                  setStep(orderType === "delivery" ? "info" : "type")
                }
                data-ocid="order.back.button"
              >
                Back
              </Button>
              <Button
                data-ocid="order.next.button"
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => setStep("payment")}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step === "payment" && (
          <div className="mt-2 space-y-4">
            <p className="text-sm text-gray-500 font-medium">
              Choose Payment Method:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                data-ocid="order.cod.button"
                onClick={() => setPayMethod("cod")}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  payMethod === "cod"
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-orange-300"
                }`}
              >
                <div className="text-2xl mb-1">💵</div>
                <div className="font-semibold text-sm text-gray-800">
                  Cash on Delivery
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Pay when delivered
                </div>
              </button>
              <button
                type="button"
                data-ocid="order.online.button"
                onClick={() => setPayMethod("online")}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  payMethod === "online"
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-orange-300"
                }`}
              >
                <div className="text-2xl mb-1">📲</div>
                <div className="font-semibold text-sm text-gray-800">
                  Online Payment
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  UPI / QR Code
                </div>
              </button>
            </div>

            {payMethod === "online" && (
              <div className="space-y-3 bg-orange-50 rounded-xl p-4 border border-orange-200">
                <p className="text-sm font-semibold text-orange-700 text-center">
                  Scan QR Code to Pay
                </p>
                <div className="flex justify-center">
                  <div className="bg-white rounded-xl p-3 shadow text-center">
                    {restaurant.upiId ? (
                      <>
                        {!qrError ? (
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${restaurant.upiId}&pn=${encodeURIComponent(restaurant.name)}&am=${grandTotal}&cu=INR&tn=Order+Payment`)}`}
                            alt="UPI QR Code"
                            className="w-44 h-44 mx-auto mb-2 rounded-lg"
                            onError={() => setQrError(true)}
                          />
                        ) : (
                          <div className="w-44 h-44 bg-gray-50 border-2 border-dashed border-orange-300 rounded-lg flex flex-col items-center justify-center mx-auto mb-2 gap-1">
                            <span className="text-xs text-gray-500 text-center px-2">
                              UPI: {restaurant.upiId}
                            </span>
                            <span className="text-xs text-orange-500 font-bold">
                              Rs.{grandTotal}
                            </span>
                          </div>
                        )}
                        <p className="text-xs font-semibold text-gray-700 mt-1">
                          UPI ID: {restaurant.upiId}
                        </p>
                        <p className="text-sm font-bold text-orange-600 mt-1">
                          Amount: Rs.{grandTotal}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-44 h-44 bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <span className="text-xs text-gray-400 text-center">
                            Scan QR to pay
                            <br />
                            Rs.{grandTotal}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Pay to: {restaurant.whatsapp || restaurant.phone}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="utr">
                    UTR Number (mandatory after payment)
                  </Label>
                  <Input
                    data-ocid="order.utr.input"
                    id="utr"
                    value={utrNo}
                    onChange={(e) => setUtrNo(e.target.value)}
                    placeholder="Enter 12-digit UTR number"
                    className="mt-1"
                    maxLength={22}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Enter UTR number after completing UPI payment
                  </p>
                </div>
              </div>
            )}

            {payMethod === "cod" && (
              <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-center">
                <div className="text-3xl mb-2">💵</div>
                <p className="text-sm font-semibold text-green-700">
                  Cash on Delivery Selected
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Pay Rs.{grandTotal} when your order arrives
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("summary")}
                data-ocid="order.back.button"
              >
                Back
              </Button>
              <Button
                data-ocid="order.place.button"
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold"
                onClick={placeOrder}
              >
                Place Order
              </Button>
            </div>
          </div>
        )}

        {step === "slip" && placedOrder && (
          <div className="mt-2">
            <div
              ref={slipRef}
              className="bg-white border rounded-xl p-5 space-y-3"
            >
              <div className="text-center border-b pb-3">
                <h2 className="text-xl font-black text-gray-900">
                  {restaurant.name}
                </h2>
                <p className="text-xs text-gray-500">{restaurant.address}</p>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order No:</span>
                <span className="font-bold text-orange-600">
                  #{placedOrder.orderNo}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date:</span>
                <span>{new Date(placedOrder.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Type:</span>
                <span className="capitalize">
                  {placedOrder.orderType === "delivery"
                    ? "Home Delivery"
                    : "Dine In"}
                </span>
              </div>
              {placedOrder.orderType === "delivery" && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Customer:</span>
                    <span>{placedOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Address:</span>
                    <span className="text-right max-w-[55%]">
                      {placedOrder.address}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Phone:</span>
                    <span>{placedOrder.phone}</span>
                  </div>
                </>
              )}
              <div className="border-t pt-3 space-y-1">
                {placedOrder.items.map((item: any, i: number) => (
                  <div key={String(i)} className="flex justify-between text-sm">
                    <span>
                      {item.name}
                      {item.variant ? ` (${item.variant})` : ""} x{item.qty}
                    </span>
                    <span>Rs.{(item.price * item.qty).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>Rs.{placedOrder.subtotal}</span>
                </div>
                {placedOrder.deliveryCharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Delivery</span>
                    <span>Rs.{placedOrder.deliveryCharge}</span>
                  </div>
                )}
                {placedOrder.packingCharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Packing</span>
                    <span>Rs.{placedOrder.packingCharge}</span>
                  </div>
                )}
                {placedOrder.platformFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Platform Fee</span>
                    <span>Rs.{placedOrder.platformFee}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t pt-1">
                  <span>TOTAL</span>
                  <span className="text-orange-600">
                    Rs.{placedOrder.total}
                  </span>
                </div>
              </div>
              <div className="border-t pt-3 text-center">
                <p className="text-sm text-gray-600">
                  Thank you for ordering from {restaurant.name}!
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  For queries call: {restaurant.phone}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                data-ocid="order.download.button"
                variant="outline"
                className="flex-1"
                onClick={downloadSlip}
              >
                <Download size={16} className="mr-2" /> Download PDF
              </Button>
              <Button
                data-ocid="order.whatsapp.button"
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                onClick={() => shareSlipWhatsApp(placedOrder)}
              >
                <MessageCircle size={16} className="mr-2" /> WhatsApp
              </Button>
            </div>
            <Button
              data-ocid="order.close.button"
              className="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleClose}
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
