'use client'

import React, { RefObject, useEffect, useState } from "react";
import Image from "next/image";

interface OrderItem {
  food_id: number;
  food_name: string;
  quantity: number;
}

interface Order {
  order_id: number;
  branch_name: string;
  delivery_date: string;
  order_date: string;
  delivery_time?: string;
  branch_address?: string;
  items: OrderItem[];
  qrCodeImageUrl?: string;
}

interface OrderDetailsModalProps {
  filteredOrders: Order[];
  printRef: RefObject<HTMLDivElement>;
  handleSaveAsPDF: () => Promise<void>;
  onClose: () => void;
  showSaveAsPDFButton: boolean;
}

export default function OrderDetailsModal({
  filteredOrders,
  printRef,
  handleSaveAsPDF,
  onClose,
  showSaveAsPDFButton,
}: OrderDetailsModalProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const calculateScale = () => {
      // A4 dimensions in pixels (at 96 DPI): 210mm = 794px, 297mm = 1123px
      const a4Width = 794;
      const a4Height = 1123;
      const padding = 100; // Space for buttons and padding
      
      const availableWidth = window.innerWidth - padding;
      const availableHeight = window.innerHeight - padding;
      
      const scaleX = availableWidth / a4Width;
      const scaleY = availableHeight / a4Height;
      
      // Use the smaller scale to ensure it fits in both dimensions, allow scaling up to 150%
      const newScale = Math.min(scaleX, scaleY, 1.5); // Allow scaling up to 150%
      setScale(newScale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 overflow-y-auto p-4">
      <div className="flex flex-col lg:flex-row items-center gap-4 max-w-full max-h-full">
        
        {/* Control Buttons - Top on mobile, side on desktop */}
        <div className="order-1 lg:order-2 flex flex-row lg:flex-col gap-4">
          {showSaveAsPDFButton && (
            <button
              onClick={handleSaveAsPDF}
              className="cursor-pointer bg-[#6D0000] text-white px-4 py-2 rounded transition transform hover:scale-105 hover:bg-[#7a0000] active:translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#6D0000] whitespace-nowrap"
            >
              Save as PDF
            </button>
          )}
          <button
            onClick={onClose}
            className="cursor-pointer bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition whitespace-nowrap"
          >
            Back to Filters
          </button>
        </div>

        <div
          ref={printRef}
          className="order-2 lg:order-1 bg-white border border-gray-300 rounded shadow-lg"
          style={{
            // Fixed A4 dimensions: 210mm x 297mm
            width: '210mm',
            height: '297mm',
            aspectRatio: '1/1.414',
            fontSize: '14px',
            lineHeight: '1.3',
            boxSizing: 'border-box',
            // Apply calculated scale
            transform: `scale(${scale})`,
            transformOrigin: 'center',
          }}
        >
          <div 
            className="h-full w-full overflow-hidden"
            style={{
              padding: '15mm', // Standard A4 margins
              boxSizing: 'border-box',
            }}
          >
            {filteredOrders.length === 0 ? (
              <p className="text-center text-sm">No orders to display.</p>
            ) : (
              <div className="h-full flex flex-col">
                {filteredOrders.map((order: Order, index: number) => {
                  const orderDateFormatted = new Date(order.order_date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: '2-digit',
                  });
                  const deliveryDateObj = new Date(order.delivery_date);
                  const deliveryDateFormatted = deliveryDateObj.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                  });
                  const deliveryDay = deliveryDateObj.toLocaleDateString('en-US', { weekday: 'short' });

                  return (
                    <div 
                      key={order.order_id || index} 
                      className="flex flex-col h-full"
                      style={{
                        pageBreakAfter: index < filteredOrders.length - 1 ? 'always' : 'auto',
                        breakAfter: index < filteredOrders.length - 1 ? 'page' : 'auto',
                      }}
                    >
                      {/* Header Section */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-4">
                          <Image
                            src="/Chateraiselogo.png"
                            alt="Chateraise Logo"
                            width={120}
                            height={120}
                            className="object-contain"
                            style={{ width: '120px', height: '120px' }}
                          />
                          {order.qrCodeImageUrl && (
                            <Image
                              src={order.qrCodeImageUrl}
                              alt="Order QR Code"
                              width={90}
                              height={90}
                              className="object-contain border border-gray-300 rounded"
                              style={{ width: '90px', height: '90px' }}
                            />
                          )}
                        </div>
                        <table className="text-xs border border-black rounded" style={{ fontSize: '12px' }}>
                          <tbody>
                            <tr>
                              <td className="border border-t-white border-b-black border-x-white p-1 font-semibold">Order Date</td>
                              <td className="border border-t-white border-b-black border-x-white px-2 py-1"></td>
                              <td className="border border-t-white border-b-black border-x-white px-2 py-1">{orderDateFormatted}</td>
                              <td className="border border-t-white border-b-black border-x-white px-2 py-1"></td>
                            </tr>
                            <tr>
                              <td className="border border-black p-1 font-semibold">Jam Datang</td>
                              <td className="border border-black px-4 py-1"></td>
                              <td className="border border-black p-1 font-semibold">Jam Selesai</td>
                              <td className="border border-black px-4 py-1"></td>
                            </tr>
                            <tr>
                              <td className="border border-black p-1 font-semibold" colSpan={4}>Suhu Truck</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Title */}
                      <h1 className="text-center font-extrabold mb-3" style={{ fontSize: '24px' }}>DELIVERY ORDER</h1>
                      
                      {/* Customer Information */}
                      <div className="mb-4 grid grid-cols-[1fr_2fr] gap-x-4" style={{ fontSize: '14px' }}>
                        <div className="col-span-full border-b border-black grid grid-cols-subgrid mb-1 pb-1">
                          <p>Customer Name :</p>
                          <p className="font-bold">{order.branch_name}</p>
                        </div>
                        <div className="col-span-full border-b border-black grid grid-cols-subgrid mb-1 pb-1">
                          <p>Delivery Date :</p>
                          <p className="font-bold">{`${deliveryDateFormatted} (${deliveryDay})`}</p>
                        </div>
                        <div className="col-span-full border-b border-black grid grid-cols-subgrid mb-1 pb-1">
                          <p>Delivery Time :</p>
                          <p className="font-bold">{order.delivery_time || "--"}</p>
                        </div>
                        <div className="col-span-full border-b border-black grid grid-cols-subgrid mb-1 pb-1">
                          <p>Delivery Address :</p>
                          <p className="font-bold">{order.branch_address || "--"}</p>
                        </div>
                      </div>

                      {/* Items Table */}
                      <div className="flex-1 mb-4">
                        <table className="w-full border border-black" style={{ fontSize: '12px' }}>
                          <thead>
                            <tr>
                              <th className="border border-t-white border-b-black border-x-white px-2 py-1"></th>
                              <th className="border border-t-white border-b-black border-x-white px-2 py-1"></th>
                              <th className="border border-t-white border-b-black border-l-white border-r-black px-2 py-1"></th>
                              <th className="border border-black px-2 py-1" colSpan={3}>
                                Damage Report (Qty)
                              </th>
                            </tr>
                            <tr>
                              <th className="border border-black px-2 py-1">Case Mark</th>
                              <th className="border border-black px-2 py-1">Product</th>
                              <th className="border border-black px-2 py-1">Qty</th>
                              <th className="border border-black px-2 py-1">Melt Cream</th>
                              <th className="border border-black px-2 py-1">Broken</th>
                              <th className="border border-black px-2 py-1">Other</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item, idx) => (
                              <tr key={idx} className="odd:bg-white even:bg-gray-50">
                                <td className="border border-black px-2 py-1">{item.food_id}</td>
                                <td className="border border-black px-2 py-1">{item.food_name}</td>
                                <td className="border border-black px-2 py-1">{item.quantity} ctn</td>
                                <td className="border border-black px-2 py-1" style={{ height: '20px' }}></td>
                                <td className="border border-black px-2 py-1" style={{ height: '20px' }}></td>
                                <td className="border border-black px-2 py-1" style={{ height: '20px' }}></td>
                              </tr>
                            ))}
                            {/* Add empty rows to fill space if needed */}
                            {Array.from({ length: Math.max(0, 8 - order.items.length) }).map((_, idx) => (
                              <tr key={`empty-${idx}`}>
                                <td className="border border-black px-2 py-1" style={{ height: '20px' }}></td>
                                <td className="border border-black px-2 py-1"></td>
                                <td className="border border-black px-2 py-1"></td>
                                <td className="border border-black px-2 py-1"></td>
                                <td className="border border-black px-2 py-1"></td>
                                <td className="border border-black px-2 py-1"></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Footer Section */}
                      <div className="flex justify-between mt-auto">
                        <div className="w-1/2 pr-4">
                          <h3 className="font-semibold mb-2" style={{ fontSize: '14px' }}>Catatan</h3>
                          <div style={{ fontSize: '11px' }} className="space-y-1">
                            <p className="font-bold underline">
                              1. Upper Carton dari pudding wajib dikembalikan
                            </p>
                            <p>2. Hitung ulang saat penerimaan</p>
                            <p>3. Komplain setelah meninggalkan toko/pabrik tidak diterima</p>
                            <p>
                              4. Jika ada produk rusak wajib menuliskan BAP & foto. Kirim segera melalui email
                            </p>
                          </div>
                        </div>

                        <div className="w-1/2">
                          <table className="w-full border border-black" style={{ fontSize: '12px' }}>
                            <thead>
                              <tr>
                                <th className="border border-black py-1">Received by</th>
                                <th className="border border-black py-1">Delivered by</th>
                                <th className="border border-black py-1">Prepared by</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-black" style={{ height: '60px', width: '80px' }}></td>
                                <td className="border border-black" style={{ height: '60px', width: '80px' }}></td>
                                <td className="border border-black" style={{ height: '60px', width: '80px' }}></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
