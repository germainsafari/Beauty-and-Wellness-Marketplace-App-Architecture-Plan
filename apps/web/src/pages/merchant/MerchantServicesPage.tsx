import { useEffect, useState } from "react";
import { formatPrice, trpcCall } from "../../lib/api";

type Service = {
  id: number;
  name: string;
  description: string | null;
  duration: number;
  price: string;
  categoryName: string | null;
  categoryIcon: string | null;
};

export default function MerchantServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trpcCall<Service[]>("merchant.services")
      .then(setServices)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black font-display">Services</h1>
          <p className="text-gray-500">Your service catalog & pricing</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading services...</div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border">
          No services yet — contact support to add your first service
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-2xl p-5 border shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                {service.categoryIcon && <span className="text-xl">{service.categoryIcon}</span>}
                {service.categoryName && (
                  <span className="text-xs font-bold text-hafi-purple bg-purple-50 px-2 py-0.5 rounded-full">
                    {service.categoryName}
                  </span>
                )}
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
    </div>
  );
}
