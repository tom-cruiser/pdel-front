import { useState, useEffect } from "react";
import { apiGet, apiPost } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { CourtSelector } from "../components/Bookings/CourtSelector";
import { TimeSlotPicker } from "../components/Bookings/TimeSlotPicker";
import { Calendar, Check, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export const BookingsPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const COACHES: { id: string; name: string }[] = [
    { id: "c1", name: "Mutika" },
    { id: "c2", name: "Seif" },
    { id: "c3", name: "Abdullah" },
    { id: "c4", name: "Malick" },
  ];
  const [courts, setCourts] = useState<any[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
  const [membershipStatus, setMembershipStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCourts();
  }, []);

  const fetchCourts = async () => {
    try {
      const res = await apiGet("/courts");
      const json = await res.json();
      if (!json.success)
        throw new Error(json.message || "Failed to fetch courts");
      // Map backend _id to id for compatibility
      const list = (json.data || []).map((c: any) => ({
        ...c,
        id: c._id || c.id,
      }));
      setCourts(list);
    } catch (err) {
      console.error("Error fetching courts:", err);
    }
  };

  const handleBooking = async () => {
    if (!selectedCourt || !selectedTime || !user) return;

    // Validate membership status
    if (!membershipStatus) {
      setError(t("bookings.membership_required"));
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // compute end time = start + 90 minutes
      const [hh, mm] = selectedTime.split(":").map((v) => parseInt(v, 10));
      const start = new Date();
      start.setHours(hh, mm, 0, 0);
      const end = new Date(start.getTime() + 90 * 60 * 1000);
      const pad = (n: number) => String(n).padStart(2, "0");
      const endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;

      const coach = COACHES.find((c) => c.id === selectedCoachId) || null;
      const bookingPayload = {
        court_id: selectedCourt.id,
        booking_date: selectedDate,
        start_time: selectedTime,
        end_time: endTime,
        notes: notes || null,
        coach_id: selectedCoachId || null,
        coach_name: coach ? coach.name : null,
        membership_status: membershipStatus,
      };
      
      console.log("Booking payload:", bookingPayload);
      
      const res = await apiPost("/bookings", bookingPayload);
      if (res.status === 401) {
        // Trigger global UI and give a helpful message
        try {
          window.dispatchEvent(
            new CustomEvent("api:unauthorized", {
              detail: { path: "bookings" },
            })
          );
        } catch {
          void 0;
        }
        throw new Error("Not authenticated");
      }
      const json = await res.json();
      if (!json.success)
        throw new Error(json.message || "Failed to create booking");

      setSuccess(true);
      setSelectedTime(null);
      setNotes("");
      setMembershipStatus("");

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      const e = err as unknown as { message?: string };
      console.error("Booking error:", e);
      if (e?.message === "Not authenticated") {
        setError(
          "Not signed in — set a dev token (in header) or sign in to continue."
        );
      } else if (e?.message) {
        // Show the actual error message from the backend
        setError(e.message);
      } else {
        setError(
          "Failed to create booking. This time slot may already be taken."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().split("T")[0];
  const maxDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl mb-4">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            {t("bookings.title")}
          </h1>
          <p className="text-xl text-gray-600">{t("bookings.subtitle")}</p>
        </div>

        {success && (
          <div className="mb-8 bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center space-x-3 animate-pulse">
            <Check className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-800">Booking Confirmed!</p>
              <p className="text-sm text-green-700">
                Your court has been successfully reserved.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {t("bookings.select_court")}
            </h2>
            <CourtSelector
              courts={courts}
              selectedCourt={selectedCourt}
              onSelect={setSelectedCourt}
            />
          </div>

          {selectedCourt && (
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 animate-fadeIn">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {t("bookings.select_date")}
              </h2>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTime(null);
                }}
                min={minDate}
                max={maxDate}
                className="w-full md:w-auto px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          )}

          {selectedCourt && selectedDate && (
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 animate-fadeIn">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {t("bookings.optional_coach")}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {t("bookings.choose_coach_description")}
              </p>
              <div className="mb-6">
                <label
                  htmlFor="coach-select"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("bookings.choose_coach")}
                </label>
                <div className="inline-block w-full md:w-1/2">
                  <select
                    id="coach-select"
                    value={selectedCoachId ?? ""}
                    onChange={(e) => setSelectedCoachId(e.target.value || null)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t("bookings.no_coach")}</option>
                    {COACHES.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">
                {t("bookings.membership_status")}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {t("bookings.select_membership")}
              </p>
              <div className="mb-6">
                <div className="inline-block w-full md:w-1/2">
                  <select
                    id="membership-select"
                    value={membershipStatus}
                    onChange={(e) => setMembershipStatus(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">{t("bookings.select_membership")}</option>
                    <option value="member">{t("bookings.member")}</option>
                    <option value="non_member">{t("bookings.non_member")}</option>
                  </select>
                </div>
              </div>

              <TimeSlotPicker
                courtId={selectedCourt.id}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onSelect={setSelectedTime}
              />
            </div>
          )}

          {selectedTime && (
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 animate-fadeIn">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {t("bookings.additional_notes")}
              </h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests or information..."
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
              />

              <div className="mt-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-800 mb-4">
                  {t("bookings.booking_summary")}
                </h3>
                <div className="space-y-2 text-gray-700">
                  <p>
                    <span className="font-semibold">
                      {t("bookings.court_label")}
                    </span>{" "}
                    {selectedCourt?.name}
                  </p>
                  <p>
                    <span className="font-semibold">
                      {t("bookings.date_label")}
                    </span>{" "}
                    {new Date(selectedDate).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-semibold">
                      {t("bookings.time_label")}
                    </span>{" "}
                    {selectedTime} -{" "}
                    {(() => {
                      const [hh, mm] = selectedTime
                        .split(":")
                        .map((v) => parseInt(v, 10));
                      const start = new Date();
                      start.setHours(hh, mm, 0, 0);
                      const end = new Date(start.getTime() + 90 * 60 * 1000);
                      return `${String(end.getHours()).padStart(
                        2,
                        "0"
                      )}:${String(end.getMinutes()).padStart(2, "0")}`;
                    })()}
                  </p>
                  {selectedCoachId && (
                    <p>
                      <span className="font-semibold">{t("bookings.coach_label")}</span>{" "}
                      {(() => {
                        const coach = COACHES.find((c) => c.id === selectedCoachId);
                        return coach ? coach.name : selectedCoachId;
                      })()}
                    </p>
                  )}
                  {membershipStatus && (
                    <p>
                      <span className="font-semibold">{t("bookings.membership_status")}:</span>{" "}
                      {membershipStatus === "member" ? t("bookings.member") : t("bookings.non_member")}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleBooking}
                disabled={loading}
                className="w-full mt-6 bg-gradient-to-r from-blue-500 to-green-500 text-white py-4 px-6 rounded-xl text-lg font-bold hover:from-blue-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                {loading
                  ? t("bookings.confirming_booking")
                  : t("bookings.confirm_booking")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
