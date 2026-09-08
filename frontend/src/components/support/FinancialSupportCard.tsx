"use client";

import { FinancialSupportRequest } from "@/services/financial-support";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Heart, MapPin, Users, Calendar, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FinancialSupportCardProps {
  request: FinancialSupportRequest;
  onContribute: (request: FinancialSupportRequest) => void;
  currentUserId: string;
  isOwner?: boolean;
}

export default function FinancialSupportCard({
  request,
  onContribute,
  currentUserId,
  isOwner = false,
}: FinancialSupportCardProps) {
  const progress = (Number(request.amountReceived) / Number(request.amountNeeded)) * 100;
  const remaining = Number(request.amountNeeded) - Number(request.amountReceived);
  const contributorCount = request._count?.contributions || 0;

  const getStatusColor = (status: FinancialSupportRequest["status"]) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "PARTIALLY_FUNDED":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "GOAL_REACHED":
        return "bg-green-100 text-green-800 border-green-300";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "CLOSED":
        return "bg-gray-100 text-gray-600 border-gray-300";
      case "EXPIRED":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const formatStatus = (status: FinancialSupportRequest["status"]) => {
    return status.replace(/_/g, " ");
  };

  const canContribute =
    !isOwner &&
    request.requesterId !== currentUserId &&
    (request.status === "OPEN" || request.status === "PARTIALLY_FUNDED") &&
    remaining > 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={request.requester.profileImage} />
              <AvatarFallback>
                {request.requester.firstName[0]}
                {request.requester.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">
                {request.requester.firstName} {request.requester.lastName}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <MapPin className="w-3 h-3" />
                <span>{request.requester.school}</span>
              </div>
            </div>
          </div>
          <Badge className={`${getStatusColor(request.status)} border`}>
            {formatStatus(request.status)}
          </Badge>
        </div>

        {/* Goal Amount */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-green-600">
              {Number(request.amountReceived).toFixed(0)} ETB
            </p>
            <p className="text-sm text-gray-600">
              of {Number(request.amountNeeded).toFixed(0)} ETB goal
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-blue-600">
              {remaining.toFixed(0)} ETB
            </p>
            <p className="text-xs text-gray-600">remaining</p>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Reason */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
          <p className="text-sm text-gray-600 line-clamp-3">{request.reason}</p>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{contributorCount} contributors</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Latest Contributors */}
        {request.contributions && request.contributions.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-600 mb-2">Recent contributors:</p>
            <div className="flex -space-x-2">
              {request.contributions.slice(0, 5).map((contribution) => (
                <Avatar key={contribution.id} className="w-8 h-8 border-2 border-white">
                  <AvatarImage src={contribution.contributor.profileImage} />
                  <AvatarFallback className="text-xs">
                    {contribution.contributor.firstName[0]}
                    {contribution.contributor.lastName[0]}
                  </AvatarFallback>
                </Avatar>
              ))}
              {contributorCount > 5 && (
                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">+{contributorCount - 5}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        {canContribute && (
          <Button
            onClick={() => onContribute(request)}
            className="w-full"
            variant="default"
          >
            <Heart className="w-4 h-4 mr-2" />
            Contribute
          </Button>
        )}

        {isOwner && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-center">
            <p className="text-sm text-blue-800 font-medium">Your Request</p>
          </div>
        )}

        {request.status === "GOAL_REACHED" && (
          <div className="bg-green-50 border border-green-200 rounded-md p-2 text-center">
            <p className="text-sm text-green-800 font-medium">🎉 Goal Reached!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
