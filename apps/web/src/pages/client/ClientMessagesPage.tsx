import { MessageCircle } from "lucide-react";

export default function ClientMessagesPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-black font-display mb-2">Messages</h1>
      <p className="text-gray-500 mb-8">Chat with sellers about marketplace items or merchants about bookings</p>
      <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-purple-200">
        <MessageCircle className="w-12 h-12 mx-auto text-purple-200 mb-4" />
        <p className="font-semibold text-gray-600">No conversations yet</p>
        <p className="text-sm text-gray-400 mt-2">Message a seller from any listing page</p>
      </div>
    </div>
  );
}
