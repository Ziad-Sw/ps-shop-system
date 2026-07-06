"use client";

import { useState, useEffect } from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
}

interface ProductsSettingsFormProps {
  initialProducts: Product[];
}

export default function ProductsSettingsForm({
  initialProducts,
}: ProductsSettingsFormProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingPrice, setEditingPrice] = useState("");

  const handleAddProduct = async () => {
    if (!newProductName.trim() || !newProductPrice) {
      setSaveMessage({
        type: "error",
        text: "يجب إدخال اسم المشروب والسعر",
      });
      return;
    }

    const price = parseFloat(newProductPrice);
    if (isNaN(price) || price < 0) {
      setSaveMessage({
        type: "error",
        text: "السعر يجب أن يكون رقمًا موجبًا",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProductName.trim(),
          price,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add product");
      }

      const result = await response.json();
      setProducts([...products, result.product]);
      setNewProductName("");
      setNewProductPrice("");
      setSaveMessage({
        type: "success",
        text: "تم إضافة المشروب بنجاح",
      });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error("Error adding product:", err);
      setSaveMessage({
        type: "error",
        text: "حدث خطأ أثناء إضافة المشروب",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProduct = async (
    id: string,
    name: string,
    price: number
  ) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update product");
      }

      const result = await response.json();
      setProducts(
        products.map((p) => (p.id === id ? result.product : p))
      );
      setSaveMessage({
        type: "success",
        text: "تم تحديث المشروب بنجاح",
      });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error("Error updating product:", err);
      setSaveMessage({
        type: "error",
        text: "حدث خطأ أثناء تحديث المشروب",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المشروب؟")) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete product");
      }

      setProducts(products.filter((p) => p.id !== id));
      setSaveMessage({
        type: "success",
        text: "تم حذف المشروب بنجاح",
      });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error("Error deleting product:", err);
      setSaveMessage({
        type: "error",
        text: "حدث خطأ أثناء حذف المشروب",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update product");
      }

      const result = await response.json();
      setProducts(
        products.map((p) => (p.id === id ? result.product : p))
      );
    } catch (err) {
      console.error("Error toggling product:", err);
      setSaveMessage({
        type: "error",
        text: "حدث خطأ أثناء تحديث المشروب",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (product: Product) => {
    setEditingProductId(product.id);
    setEditingName(product.name);
    setEditingPrice(product.price.toString());
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setEditingName("");
    setEditingPrice("");
  };

  const handleSaveEdit = async () => {
    if (!editingProductId || !editingName.trim() || !editingPrice) {
      setSaveMessage({
        type: "error",
        text: "يجب إدخال اسم المشروب والسعر",
      });
      return;
    }

    const price = parseFloat(editingPrice);
    if (isNaN(price) || price < 0) {
      setSaveMessage({
        type: "error",
        text: "السعر يجب أن يكون رقمًا موجبًا",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/products/${editingProductId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingName.trim(),
          price,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update product");
      }

      const result = await response.json();
      setProducts(
        products.map((p) => (p.id === editingProductId ? result.product : p))
      );
      setSaveMessage({
        type: "success",
        text: "تم تحديث المشروب بنجاح",
      });
      setTimeout(() => setSaveMessage(null), 3000);
      handleCancelEdit();
    } catch (err) {
      console.error("Error updating product:", err);
      setSaveMessage({
        type: "error",
        text: "حدث خطأ أثناء تحديث المشروب",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Product */}
      <div className="rounded-xl bg-surface-card p-6">
        <h2 className="text-lg font-semibold text-foreground">إضافة مشروب جديد</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          أضف مشروب جديد لقائمة المبيعات
        </p>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            className="flex-1 min-h-[44px] rounded-lg border border-foreground-muted/20 bg-surface-page px-3 py-2 text-foreground placeholder-foreground-muted/50 transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="اسم المشروب"
          />
          <input
            type="number"
            min="0"
            step="1"
            value={newProductPrice}
            onChange={(e) => setNewProductPrice(e.target.value)}
            className="w-32 min-h-[44px] rounded-lg border border-foreground-muted/20 bg-surface-page px-3 py-2 text-foreground placeholder-foreground-muted/50 transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="السعر"
          />
          <button
            onClick={handleAddProduct}
            disabled={isSaving}
            className="min-h-[44px] min-w-[100px] rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface-page transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "جاري..." : "إضافة"}
          </button>
        </div>
      </div>

      {/* Products List */}
      <div className="rounded-xl bg-surface-card p-6">
        <h2 className="text-lg font-semibold text-foreground">المشروبات الحالية</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          قائمة المشروبات المتاحة للبيع
        </p>

        <div className="mt-4 space-y-3">
          {products.length === 0 ? (
            <div className="text-center py-8 text-foreground-muted">
              لا توجد مشروبات حاليًا
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 rounded-lg border border-foreground-muted/20 bg-surface-page p-3"
              >
                <div className="flex-1">
                  {editingProductId === product.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full min-h-[44px] rounded-lg border border-foreground-muted/20 bg-surface-page px-3 py-2 text-foreground placeholder-foreground-muted/50 transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      disabled={isSaving}
                    />
                  ) : (
                    <div className="text-foreground">{product.name}</div>
                  )}
                </div>
                <div className="w-24">
                  {editingProductId === product.id ? (
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editingPrice}
                      onChange={(e) => setEditingPrice(e.target.value)}
                      className="w-full min-h-[44px] rounded-lg border border-foreground-muted/20 bg-surface-page px-3 py-2 text-foreground placeholder-foreground-muted/50 transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      disabled={isSaving}
                    />
                  ) : (
                    <div className="text-foreground">{product.price}</div>
                  )}
                </div>
                {editingProductId === product.id ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="min-h-[44px] min-w-[44px] rounded-lg px-3 py-2 text-sm font-medium bg-primary text-surface-page transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      حفظ
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="min-h-[44px] min-w-[44px] rounded-lg px-3 py-2 text-sm font-medium border border-foreground-muted/20 text-foreground transition-colors hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      إلغاء
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleStartEdit(product)}
                      disabled={isSaving}
                      className="min-h-[44px] min-w-[44px] rounded-lg px-3 py-2 text-sm font-medium bg-primary/10 text-primary transition-colors hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleToggleActive(product.id, product.is_active)}
                      disabled={isSaving}
                      className={`min-h-[44px] min-w-[44px] rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        product.is_active
                          ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                          : "bg-surface-page border border-foreground-muted/20 text-foreground-muted hover:border-primary/50"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {product.is_active ? "مفعّل" : "معطّل"}
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      disabled={isSaving}
                      className="min-h-[44px] min-w-[44px] rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      حذف
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {saveMessage && (
        <div
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            saveMessage.type === "success"
              ? "bg-primary/10 text-primary"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {saveMessage.text}
        </div>
      )}
    </div>
  );
}
