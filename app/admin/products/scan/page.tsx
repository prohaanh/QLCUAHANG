'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import BarcodeScanner from '@/components/BarcodeScanner';
import { createClient } from '@/lib/supabase/browser'; // đối chiếu tên export thật trong file này
import { ui } from '@/lib/scan-styles';

type Product = {
  id: string | number;
  name: string;
  barcode: string | null;
  price: number;
  stock_qty: number;
  warranty_months: number | null;
};

const COLS = 'id, name, barcode, price, stock_qty, warranty_months';

export default function ScanProductPage() {
  const supabase = useMemo(() => createClient(), []);

  const [step, setStep] = useState<'idle' | 'found' | 'new'>('idle');
  const [code, setCode] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  // form thêm mới
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [warranty, setWarranty] = useState('');
  const [stock, setStock] = useState('');
  // nhập thêm kho
  const [addQty, setAddQty] = useState('');

  function reset() {
    setStep('idle');
    setCode('');
    setProduct(null);
    setErr('');
    setMsg('');
    setName('');
    setPrice('');
    setWarranty('');
    setStock('');
    setAddQty('');
  }

  async function handleScan(raw: string) {
    const value = raw.trim();
    if (!value) return;
    setErr('');
    setMsg('');
    setCode(value);
    setBusy(true);
    const { data, error } = await supabase
      .from('products')
      .select(COLS)
      .eq('barcode', value)
      .maybeSingle();
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    if (data) {
      setProduct(data as Product);
      setStep('found');
    } else {
      setProduct(null);
      setStep('new');
    }
  }

  async function refetch(id: Product['id']) {
    const { data } = await supabase.from('products').select(COLS).eq('id', id).maybeSingle();
    if (data) setProduct(data as Product);
  }

  async function addStock() {
    if (!product) return;
    const qty = parseInt(addQty, 10);
    if (!(qty > 0)) {
      setErr('Số lượng nhập phải lớn hơn 0.');
      return;
    }
    setErr('');
    setMsg('');
    setBusy(true);
    const { error } = await supabase.from('inventory_movements').insert({
      product_id: product.id,
      type: 'nhap',
      quantity: qty,
      note: 'Nhập kho qua quét mã',
    });
    if (error) {
      setBusy(false);
      setErr(error.message);
      return;
    }
    await refetch(product.id); // trigger đã tự cộng vào stock_qty
    setBusy(false);
    setAddQty('');
    setMsg(`Đã nhập thêm ${qty}.`);
  }

  async function createProduct() {
    if (!name.trim()) {
      setErr('Nhập tên sản phẩm.');
      return;
    }
    setErr('');
    setMsg('');
    setBusy(true);
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: name.trim(),
        barcode: code,
        price: Number(price) || 0,
        warranty_months: Number(warranty) || 0,
        stock_qty: 0, // tồn đầu đi qua inventory_movements để có lịch sử
      })
      .select(COLS)
      .single();
    if (error || !data) {
      setBusy(false);
      setErr(error?.message || 'Không thêm được sản phẩm.');
      return;
    }

    const qty = parseInt(stock, 10);
    if (qty > 0) {
      const { error: e2 } = await supabase.from('inventory_movements').insert({
        product_id: (data as Product).id,
        type: 'nhap',
        quantity: qty,
        note: 'Tồn đầu khi thêm nhanh bằng quét mã',
      });
      if (e2) setErr(`Đã thêm sản phẩm nhưng nhập tồn đầu lỗi: ${e2.message}`);
    }
    await refetch((data as Product).id);
    setBusy(false);
    setStep('found');
    setMsg('Đã thêm sản phẩm mới.');
  }

  return (
    <div style={ui.page}>
      <h1 style={{ fontSize: 20, margin: 0 }}>Quét mã vạch sản phẩm</h1>
      <Link href="/admin/products" style={ui.muted}>
        ← Về danh sách sản phẩm
      </Link>

      {step === 'idle' && <BarcodeScanner mode="barcode" onScan={handleScan} />}
      {busy && <div style={ui.muted}>Đang xử lý…</div>}
      {err && <div style={ui.error}>{err}</div>}
      {msg && <div style={ui.ok}>{msg}</div>}

      {step === 'found' && product && (
        <div style={ui.card}>
          <strong>{product.name}</strong>
          <div style={ui.muted}>Mã: {product.barcode}</div>
          <div>Giá: {Number(product.price).toLocaleString('vi-VN')}đ</div>
          <div>Tồn kho: {product.stock_qty}</div>
          <div>Bảo hành: {product.warranty_months ?? 0} tháng</div>

          <div style={ui.label}>Nhập thêm vào kho</div>
          <div style={ui.row}>
            <input
              style={{ ...ui.input, width: 120 }}
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="Số lượng"
              value={addQty}
              onChange={(e) => setAddQty(e.target.value)}
            />
            <button type="button" style={ui.btn} disabled={busy} onClick={addStock}>
              Nhập kho
            </button>
          </div>
          <Link href={`/admin/products/${product.id}/history`} style={ui.muted}>
            Xem lịch sử kho →
          </Link>
        </div>
      )}

      {step === 'new' && (
        <div style={ui.card}>
          <strong>Mã {code} chưa có trong hệ thống</strong>
          <div style={ui.label}>Tên sản phẩm *</div>
          <input style={ui.input} value={name} onChange={(e) => setName(e.target.value)} />
          <div style={ui.label}>Giá bán (đ)</div>
          <input
            style={ui.input}
            type="number"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <div style={ui.label}>Bảo hành (tháng)</div>
          <input
            style={ui.input}
            type="number"
            inputMode="numeric"
            value={warranty}
            onChange={(e) => setWarranty(e.target.value)}
          />
          <div style={ui.label}>Tồn đầu (nếu có)</div>
          <input
            style={ui.input}
            type="number"
            inputMode="numeric"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
          <button type="button" style={ui.btn} disabled={busy} onClick={createProduct}>
            Thêm sản phẩm
          </button>
        </div>
      )}

      {step !== 'idle' && (
        <button type="button" style={ui.btnGhost} onClick={reset}>
          Quét mã khác
        </button>
      )}
    </div>
  );
}
