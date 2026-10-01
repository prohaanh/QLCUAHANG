"use client";

import { useState, useTransition } from "react";
import {
  addOrderItem,
  removeOrderItem,
  updateOrderStatus,
  updateItemFulfillment,
  searchCatalog,
} from "../actions";

const STATUS_LABEL: Record<string, string> = {
  mo: "Đang mở",
  da_thanh_toan: "Đã thanh toán",
  huy: "Đã huỷ",
};

const FULFILL_LABEL: Record<string, string> = {
  dat_truoc: "Đặt trước (chờ hàng)",
  du_hang: "Đủ hàng, chưa giao",
  da_giao: "Đã giao",
};

const FULFILL_COLOR: Record<string, string> = {
  dat_truoc: "bg-orange-100 text-orange-700",
  du_hang: "bg-blue-100 text-blue-700",
  da_giao: "bg-green-100 text-green-700",
};

function itemName(item: any) {
  if (item.item_type === "product") return item.products?.name ?? "(sản phẩm đã xoá)";
  if (item.item_type === "service") return item.services?.name ?? "(dịch vụ đã xoá)";
  return item.licenses?.product_name ?? "(license đã xoá)";
}

export default function OrderDetailClient({ order }: { order: any }) {
  const [items, setItems] = useState(order.order_items ?? []);
  const [status, setStatus] = useState(order.status);
  const [isPending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [itemType, setItemType] = useState<"product" | "service" | "license">("product");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [quantity, setQuantity] = useState("1");
  const [selectedLicense, setSelectedLicense] = useState<any>(null);
  const [licensePrice, setLicensePrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  const calculatedTotal = items.reduce(
    (sum: number, i: any) => sum + i.quantity * i.unit_price,
    0,
  );
  const storedTotal = Number(order.total ?? 0);

  async function handleSearch(q: string) {
    setQuery(q);
    if (q.trim().length < 1) {
      setResults([]);
      return;
    }
    const data = await searchCatalog(itemType, q);
    setResults(data);
  }

  async function saveItem(row: any, price: number) {
    const fd = new FormData();
    fd.set("order_id", order.id);
    fd.set("item_type", itemType);
    fd.set("ref_id", row.id);
    fd.set("quantity", quantity);
    fd.set("unit_price", String(price));

    startTransition(async () => {
      const res = await addOrderItem(fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      window.location.reload();
    });
  }

  function handleAdd(row: any) {
    if (itemType === "license") {
      setSelectedLicense(row);
      setLicensePrice("");
      return;
    }
    void saveItem(row, Number(row.price ?? row.default_price ?? 0));
  }

  function handleAddLicense() {
    const price = Number(licensePrice);
    if (!selectedLicense || !licensePrice || !Number.isFinite(price) || price < 0) {
      setError("Nhập giá bán hợp lệ cho license.");
      return;
    }
    void saveItem(selectedLicense, price);
  }

  function handleRemove(itemId: string) {
    startTransition(async () => {
      const res = await removeOrderItem(itemId, order.id);
      if (res.error) {
        setError(res.error);
        return;
      }
      setItems((prev: any[]) => prev.filter((i) => i.id !== itemId));
    });
  }

  function handleStatusChange(newStatus: "mo" | "da_thanh_toan" | "huy") {
    startTransition(async () => {
      const res = await updateOrderStatus(order.id, newStatus);
      if (res.error) {
        setError(res.error);
        return;
      }
      setStatus(newStatus);
      window.location.reload();
    });
  }

  function handleFulfillmentChange(itemId: string, value: "dat_truoc" | "du_hang" | "da_giao") {
    startTransition(async () => {
      const res = await updateItemFulfillment(itemId, order.id, value);
      if (res.error) {
        setError(res.error);
        return;
      }
      setItems((prev: any[]) =>
        prev.map((i) => (i.id === itemId ? { ...i, fulfillment_status: value } : i)),
      );
    });
  }

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">
          {order.customers?.name ?? "Khách lẻ"}
        </h1>
        <div className="text-sm text-gray-500">
          {new Date(order.created_at).toLocaleString("vi-VN")}
        </div>
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg p-2">{error}</div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <span className="px-3 py-1.5 rounded-full text-xs font-medium border bg-blue-600 text-white border-blue-600">
          {STATUS_LABEL[status]}
        </span>
        {status === "mo" && (
          <>
            <button
              disabled={isPending}
              onClick={() => handleStatusChange("da_thanh_toan")}
              className="px-3 py-1.5 rounded text-xs font-medium bg-green-700 text-white disabled:opacity-50"
            >
              Đánh dấu đã thanh toán
            </button>
            <button
              disabled={isPending}
              onClick={() => handleStatusChange("huy")}
              className="px-3 py-1.5 rounded text-xs font-medium border border-red-300 text-red-700 disabled:opacity-50"
            >
              Hủy đơn
            </button>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {items.map((item: any) => (
          <div
            key={item.id}
            className="border rounded-lg p-3 flex items-center justify-between gap-2"
          >
            <div className="flex-1">
              <div className="font-medium">{itemName(item)}</div>
              <div className="text-xs text-gray-500">
                SL {item.quantity} × {item.unit_price.toLocaleString("vi-VN")}đ
              </div>
              {item.item_type === "product" && (
                <select
                  value={item.fulfillment_status}
                  disabled={isPending || status !== "da_thanh_toan" || item.fulfillment_status === "da_giao"}
                  onChange={(e) =>
                    handleFulfillmentChange(item.id, e.target.value as any)
                  }
                  className={`mt-1 text-xs font-medium rounded-full px-2 py-1 border-0 ${FULFILL_COLOR[item.fulfillment_status]}`}
                >
                  <option value="dat_truoc">{FULFILL_LABEL.dat_truoc}</option>
                  <option value="du_hang">{FULFILL_LABEL.du_hang}</option>
                  <option value="da_giao">{FULFILL_LABEL.da_giao}</option>
                </select>
              )}
            </div>
            {status === "mo" && (
              <button
                onClick={() => handleRemove(item.id)}
                disabled={isPending}
                className="text-xs text-red-500 px-2 py-1"
              >
                Xoá
              </button>
            )}
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center text-gray-400 py-6">Chưa có mặt hàng nào</div>
        )}
      </div>

      <div className="flex items-center justify-between font-semibold border-t pt-3 mb-4">
        <span>Tổng đơn (đã lưu)</span>
        <span>{storedTotal.toLocaleString("vi-VN")}đ</span>
      </div>
      {Math.abs(storedTotal - calculatedTotal) > 0.001 && (
        <p role="alert" className="mb-4 text-sm text-red-700">
          Tổng đơn không khớp tổng các dòng ({calculatedTotal.toLocaleString("vi-VN")}đ). Kiểm tra trigger/cập nhật dữ liệu trước khi thanh toán.
        </p>
      )}

      {status === "mo" && (
        <div className="border rounded-lg p-3">
          {!showAdd ? (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full text-center text-blue-600 font-medium py-2"
            >
              + Thêm mặt hàng
            </button>
          ) : (
            <div>
              <div className="flex gap-2 mb-2">
                {(["product", "service", "license"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setItemType(t);
                      setResults([]);
                      setQuery("");
                      setSelectedLicense(null);
                      setError(null);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      itemType === t
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {t === "product" ? "Sản phẩm" : t === "service" ? "Dịch vụ" : "License"}
                  </button>
                ))}
              </div>
              <input
                autoFocus
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Gõ tên để tìm..."
                className="w-full border rounded-lg px-3 py-2 mb-2"
              />
              <label className="block text-xs text-gray-600 mb-2">
                Số lượng
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className="ml-2 w-24 border rounded px-2 py-1"
                />
              </label>
              <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                {results.map((row) => (
                  <button
                    key={row.id}
                    onClick={() => handleAdd(row)}
                    disabled={isPending}
                    className="text-left border rounded-lg px-3 py-2 hover:bg-gray-50"
                  >
                    <div className="font-medium">
                      {row.name ?? row.product_name}
                    </div>
                    {row.price != null && (
                      <div className="text-xs text-gray-500">
                        {row.price.toLocaleString("vi-VN")}đ · tồn {row.stock_qty}
                      </div>
                    )}
                    {row.default_price != null && (
                      <div className="text-xs text-gray-500">
                        {row.default_price.toLocaleString("vi-VN")}đ
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {selectedLicense && (
                <div className="mt-3 border-t pt-3">
                  <p className="text-sm font-medium">{selectedLicense.product_name}</p>
                  <label className="block text-xs text-gray-600 mt-2">
                    Giá license
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={licensePrice}
                      onChange={(event) => setLicensePrice(event.target.value)}
                      className="ml-2 w-32 border rounded px-2 py-1"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleAddLicense}
                    className="mt-2 px-3 py-1.5 rounded bg-blue-600 text-white text-xs disabled:opacity-50"
                  >
                    Thêm license
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
