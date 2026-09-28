import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createOrder } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  mo: "Đang mở",
  da_thanh_toan: "Đã thanh toán",
  huy: "Đã huỷ",
};

const STATUS_COLOR: Record<string, string> = {
  mo: "bg-yellow-100 text-yellow-800",
  da_thanh_toan: "bg-green-100 text-green-800",
  huy: "bg-gray-200 text-gray-600",
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      `id, status, created_at,
       customers ( id, name, phone ),
       order_items ( id, fulfillment_status, item_type )`,
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Đơn hàng</h1>
        <form action={createOrder.bind(null, null)}>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium"
          >
            + Tạo đơn mới
          </button>
        </form>
      </div>

      {searchParams?.error === "create" && (
        <p role="alert" className="mb-3 text-sm text-red-600">
          Không tạo được đơn hàng. Vui lòng thử lại.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {(orders ?? []).map((order: any) => {
          const items = order.order_items ?? [];
          const soChoHang = items.filter(
            (i: any) => i.fulfillment_status === "dat_truoc",
          ).length;

          return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="border rounded-lg p-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div>
                <div className="font-medium">
                  {order.customers?.name ?? "Khách lẻ"}{" "}
                  {order.customers?.phone && (
                    <span className="text-gray-400 text-sm">
                      · {order.customers.phone}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(order.created_at).toLocaleString("vi-VN")} ·{" "}
                  {items.length} mặt hàng
                  {soChoHang > 0 && (
                    <span className="text-orange-600 font-medium">
                      {" "}
                      · {soChoHang} đang chờ hàng
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLOR[order.status]}`}
              >
                {STATUS_LABEL[order.status]}
              </span>
            </Link>
          );
        })}

        {(!orders || orders.length === 0) && (
          <div className="text-center text-gray-400 py-10">
            Chưa có đơn hàng nào
          </div>
        )}
      </div>
    </div>
  );
}
