import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const TYPE_LABEL: Record<string, string> = {
  nhap: "Nhập kho",
  xuat: "Xuất kho",
  dieu_chinh: "Điều chỉnh",
};

const TYPE_COLOR: Record<string, string> = {
  nhap: "text-green-600",
  xuat: "text-red-600",
  dieu_chinh: "text-gray-500",
};

export default async function ProductInventoryHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("id, name, stock_qty")
    .eq("id", id)
    .single();

  if (!product) notFound();

  const { data: movements } = await supabase
    .from("inventory_movements")
    .select("id, type, quantity, note, created_at, order_id")
    .eq("product_id", id)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Link href="/admin/products" className="text-sm text-blue-600">
        ← Về danh sách sản phẩm
      </Link>

      <div className="mt-2 mb-4">
        <h1 className="text-xl font-semibold">{product.name}</h1>
        <div className="text-sm text-gray-500">
          Tồn kho hiện tại: <span className="font-medium">{product.stock_qty}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {(movements ?? []).map((m: any) => (
          <div
            key={m.id}
            className="border rounded-lg p-3 flex items-center justify-between"
          >
            <div>
              <div className={`font-medium ${TYPE_COLOR[m.type]}`}>
                {TYPE_LABEL[m.type]}
                {m.type !== "nhap" ? " -" : " +"}
                {Math.abs(m.quantity)}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(m.created_at).toLocaleString("vi-VN")}
                {m.order_id && (
                  <>
                    {" · "}
                    <Link href={`/orders/${m.order_id}`} className="text-blue-600">
                      xem đơn
                    </Link>
                  </>
                )}
              </div>
              {m.note && <div className="text-xs text-gray-400">{m.note}</div>}
            </div>
          </div>
        ))}

        {(!movements || movements.length === 0) && (
          <div className="text-center text-gray-400 py-10">
            Chưa có lịch sử nhập/xuất
          </div>
        )}
      </div>
    </div>
  );
}
