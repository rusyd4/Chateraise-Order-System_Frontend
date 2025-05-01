'use client'

import React, { RefObject } from "react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

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
  printRef: RefObject<HTMLDivElement | null>;
  handleSaveAsPDF: () => Promise<void>;
  onClose: () => void;
}

export default function OrderDetailsModal({
  filteredOrders,
  printRef,
  handleSaveAsPDF,
  onClose,
}: OrderDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 overflow-y-auto">
      <div
        ref={printRef}
        className="bg-white p-8 border border-gray-300 rounded shadow"
        style={{ height: '95vh', width: 'calc(95vh / 1.414)' }}
      >
        {filteredOrders.length === 0 ? (
          <p>No orders to display.</p>
        ) : (
          <>
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
                <div key={order.order_id || index} className="mb-6 border-b border-gray-300 pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src="/Chateraiselogo.png"
                        alt="Chateraise Logo"
                        width={120}
                        height={120}
                        className="object-contain"
                      />
                      {order.qrCodeImageUrl && (
                        <img
                          src={order.qrCodeImageUrl}
                          alt="Order QR Code"
                          width={80}
                          height={80}
                          className="object-contain border border-gray-300 rounded"
                        />
                      )}
                    </div>
                    <table className="text-sm border border-black rounded w-auto">
                      <tbody>
                        <tr>
                          <td className="text-[10px] border border-t-white border-b-black border-x-white p-1 font-semibold">Order Date</td>
                          <td className="text-[10px] border border-t-white border-b-black border-x-white px-2 py-1"></td>
                          <td className="text-[10px] border border-t-white border-b-black border-x-white x-2 py-1">{orderDateFormatted}</td>
                          <td className="text-[10px] border border-t-white border-b-black border-x-white px-2 py-1"></td>
                        </tr>
                        <tr>
                          <td className="text-[10px] border border-black p-1 font-semibold">Jam Datang</td>
                          <td className="text-[10px] border border-black px-6 py-1"></td>
                          <td className="text-[10px] border border-black p-1 font-semibold">Jam Selesai</td>
                          <td className="text-[10px] border border-black px-6 py-1"></td>
                        </tr>
                        <tr>
                          <td className="text-[10px] border border-black p-1 font-semibold">Suhu Truck</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h1 className="text-center text-4xl font-extrabold mb-6">DELIVERY ORDER</h1>

                  <div className="mb-6 grid grid-cols-3 gap-x-8">
                    <div className="space-y-1">
                      <p>Customer Name  :</p>
                      <p>Delivery Date  :</p>
                      <p>Delivery Time  :</p>
                      <p>Delivery Address :</p>
                    </div>
                    <div className="space-y-1 font-bold">
                      <p>{order.branch_name}</p>
                      <p>{`${deliveryDateFormatted} (${deliveryDay})`}</p>
                      <p>{order.delivery_time || "--"}</p>
                      <p>{order.branch_address || "--"}</p>
                    </div>
                  </div>

                  <table className="w-full border border-black rounded mb-6 text-sm">
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
                          <td className="border border-black px-2 py-1">{item.quantity} carton</td>
                          <td className="border border-black px-2 py-1"></td>
                          <td className="border border-black px-2 py-1"></td>
                          <td className="border border-black px-2 py-1"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-between">
                    <div className="w-1/2">
                      <h3 className="font-semibold mb-2">Catatan</h3>
                      <ul className="list-disc list-inside text-[10px] space-y-1">
                        <p className="font-bold underline">
                          1. Upper Carton dari pudding wajib dikembalikan
                        </p>
                        <p>2. Hitung ulang saat penerimaan</p>
                        <p>3. Komplain setelah meninggalkan toko/pabrik tidak diterima</p>
                        <p>
                          4. Jika ada produk rusak wajib menuliskan BAP & foto. Kirim segera melalui email
                        </p>
                      </ul>
                    </div>

                    <div className="w-1/2 pl-4">
                      <table className="w-full border border-black text-[12px]">
                        <thead>
                          <tr>
                            <th className="border border-black py-1">Received by</th>
                            <th className="border border-black py-1">Delivered by</th>
                            <th className="border border-black py-1">Prepared by</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-black px-8 py-8"></td>
                            <td className="border border-black px-8 py-8"></td>
                            <td className="border border-black px-8 py-8"></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
      <div className="ml-4 flex flex-col space-y-4">
        <button
          onClick={handleSaveAsPDF}
          className="bg-[#6D0000] text-white px-4 py-2 rounded transition transform hover:scale-105 hover:bg-[#7a0000] active:translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#6D0000]"
        >
          Save as PDF
        </button>
        <button
          onClick={onClose}
          className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
        >
          Back to Filters
        </button>
      </div>
    </div>
  );
}
