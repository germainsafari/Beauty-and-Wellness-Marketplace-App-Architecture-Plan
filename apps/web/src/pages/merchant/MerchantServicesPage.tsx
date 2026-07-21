import { useCallback, useEffect, useState } from "react";
import { Edit2, Plus, Trash2, X } from "lucide-react";
import { formatPrice, trpcCall } from "../../lib/api";

type Category = { id: number; name: string; icon: string | null };

type Service = {
  id: number;
  name: string;
  description: string | null;
  duration: number;
  price: string;
  categoryId: number | null;
  categoryName: string | null;
  categoryIcon: string | null;
  isActive: boolean;
};

type ServiceForm = {
  name: string;
  description: string;
  duration: string;
  price: string;
  categoryId: string;
};

const emptyForm: ServiceForm = {
  name: "",
  description: "",
  duration: "60",
  price: "",
  categoryId: "",
};

export default function MerchantServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadServices = useCallback(() => {
    trpcCall<Service[]>("merchant.services")
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadServices();
    trpcCall<Category[]>("discovery.categories").then(setCategories).catch(() => {});
  }, [loadServices]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEdit = (service: Service) => {
    setEditing(service);
    setForm({
      name: service.name,
      description: service.description ?? "",
      duration: String(service.duration),
      price: String(Number(service.price)),
      categoryId: service.categoryId ? String(service.categoryId) : "",
    });
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    setError("");
  };

  const save = async () => {
    const duration = parseInt(form.duration, 10);
    const price = parseFloat(form.price);
    if (!form.name.trim()) {
      setError("Service name is required");
      return;
    }
    if (isNaN(duration) || duration < 5) {
      setError("Duration must be at least 5 minutes");
      return;
    }
    if (isNaN(price) || price <= 0) {
      setError("Price must be greater than zero");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        duration,
        price,
        categoryId: form.categoryId ? parseInt(form.categoryId, 10) : undefined,
      };

      if (editing) {
        await trpcCall("merchant.updateService", { id: editing.id, ...payload }, "mutation");
      } else {
        await trpcCall("merchant.createService", payload, "mutation");
      }
      closeForm();
      loadServices();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save service");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (service: Service) => {
    if (!confirm(`Remove "${service.name}"? Clients will no longer see this service.`)) return;
    try {
      await trpcCall("merchant.deleteService", { id: service.id }, "mutation");
      loadServices();
    } catch {
      alert("Could not remove service");
    }
  };

  const activeServices = services.filter((s) => s.isActive);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-black font-display">Services</h1>
          <p className="text-gray-500">Add services that clients can discover and book</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-hafi-purple text-white font-bold px-5 py-2.5 rounded-xl hover:shadow-lg transition-shadow shrink-0"
        >
          <Plus size={18} /> Add service
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading services...</div>
      ) : activeServices.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border">
          <p className="text-gray-400 mb-4">No services yet — add your first service to appear on client dashboards</p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-hafi-purple text-white font-bold px-6 py-3 rounded-xl"
          >
            <Plus size={18} /> Add your first service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeServices.map((service) => (
            <div key={service.id} className="bg-white rounded-2xl p-5 border shadow-sm group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 mb-2">
                  {service.categoryIcon && <span className="text-xl">{service.categoryIcon}</span>}
                  {service.categoryName && (
                    <span className="text-xs font-bold text-hafi-purple bg-purple-50 px-2 py-0.5 rounded-full">
                      {service.categoryName}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(service)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => remove(service)}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="font-bold text-lg">{service.name}</p>
              {service.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{service.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">{service.duration} min</p>
              <p className="text-hafi-purple font-black text-xl mt-2">{formatPrice(service.price)}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between rounded-t-3xl">
              <div>
                <p className="text-xs font-bold text-hafi-purple uppercase tracking-wide">
                  {editing ? "Edit service" : "New service"}
                </p>
                <h2 className="text-xl font-black font-display mt-0.5">
                  {editing ? editing.name : "Add to your catalog"}
                </h2>
              </div>
              <button onClick={closeForm} className="p-2 hover:bg-gray-100 rounded-xl">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-bold block mb-1.5">Service name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Haircut & styling"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-hafi-purple"
                />
              </div>

              <div>
                <label className="text-sm font-bold block mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What's included in this service?"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none h-20 outline-none focus:border-hafi-purple"
                />
              </div>

              <div>
                <label className="text-sm font-bold block mb-1.5">Category</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-hafi-purple bg-white"
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold block mb-1.5">Duration (min) *</label>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-hafi-purple"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1.5">Price (RWF) *</label>
                  <input
                    type="number"
                    min={1}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="15000"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-hafi-purple"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

              <button
                onClick={save}
                disabled={saving}
                className="w-full bg-gradient-to-r from-hafi-purple to-violet-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-shadow disabled:opacity-60"
              >
                {saving ? "Saving..." : editing ? "Save changes" : "Add service"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
