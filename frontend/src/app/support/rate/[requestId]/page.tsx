"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Star, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { useSupportRequest, useRateSupportProvider } from "@/hooks/useSupport";

export default function RateSupportPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.requestId as string;

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const { data: request, isLoading } = useSupportRequest(requestId);
  const rateProvider = useRateSupportProvider();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      return;
    }

    rateProvider.mutate(
      {
        requestId,
        data: {
          rating,
          ...(feedback.trim() && { feedback: feedback.trim() }),
        },
      },
      {
        onSuccess: () => {
          router.push("/support/dashboard");
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#043658]" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Request not found
          </h2>
          <button
            onClick={() => router.push("/support/dashboard")}
            className="text-[#043658] hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (request.status !== "COMPLETED") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Cannot rate incomplete support
          </h2>
          <p className="text-slate-600 mb-4">
            This support request must be completed before you can rate it
          </p>
          <button
            onClick={() => router.push("/support/dashboard")}
            className="text-[#043658] hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (request.rating) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Already Rated
          </h2>
          <p className="text-slate-600 mb-4">
            You have already submitted a rating for this support
          </p>
          <button
            onClick={() => router.push("/support/dashboard")}
            className="px-6 py-3 bg-[#043658] text-white font-semibold rounded-xl hover:bg-[#043658]/90 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const providerName = request.provider
    ? `${request.provider.teacher.firstName} ${request.provider.teacher.lastName}`
    : "Unknown";

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/support/dashboard")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Rate Your Support Experience
            </h1>
            <p className="text-slate-600">
              Help us improve by sharing your experience with {providerName}
            </p>
          </div>

          {/* Request Summary */}
          <div className="bg-slate-50 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-slate-900 mb-2">{request.topic}</h3>
            <p className="text-sm text-slate-600 line-clamp-2 mb-3">
              {request.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>Provider: {providerName}</span>
              <span>•</span>
              <span>{request.supportType.replace("_", " ")}</span>
            </div>
          </div>

          {/* Rating Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Star Rating */}
            <div>
              <label className="block text-center font-semibold text-slate-900 mb-4">
                How would you rate this support? *
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-12 w-12 ${
                        star <= (hoveredRating || rating)
                          ? "fill-[#FFC107] text-[#FFC107]"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm text-slate-600 mt-4">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </p>
              )}
            </div>

            {/* Feedback */}
            <div>
              <label className="block font-semibold text-slate-900 mb-2">
                Additional Feedback (Optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share more details about your experience..."
                rows={6}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#043658] focus:border-transparent resize-none text-slate-900 placeholder:text-slate-400"
                maxLength={1000}
                disabled={rateProvider.isPending}
              />
              <p className="mt-2 text-xs text-slate-500">
                {feedback.length}/1000 characters
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/support/dashboard")}
                className="flex-1 px-6 py-3 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                disabled={rateProvider.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={rating === 0 || rateProvider.isPending}
                className="flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-[#043658] hover:bg-[#043658]/90 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {rateProvider.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Rating"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
