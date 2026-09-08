"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { financialSupportApi, FinancialSupportRequest } from "@/services/financial-support";
import { walletApi } from "@/services/wallet";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Heart, TrendingUp, Users, Plus, Filter } from "lucide-react";
import CreateFinancialSupportModal from "@/components/support/CreateFinancialSupportModal";
import ContributeModal from "@/components/support/ContributeModal";
import FinancialSupportCard from "@/components/support/FinancialSupportCard";

export default function FinancialSupportPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<FinancialSupportRequest[]>([]);
  const [myRequests, setMyRequests] = useState<FinancialSupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FinancialSupportRequest | null>(null);
  const [activeTab, setActiveTab] = useState<"discover" | "my-requests" | "my-contributions">("discover");
  const [statusFilter, setStatusFilter] = useState<FinancialSupportRequest["status"] | "ALL">("ALL");

  useEffect(() => {
    if (user) {
      loadData();
      loadWalletBalance();
    }
  }, [user, activeTab, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (activeTab === "discover") {
        const params: any = {};
        if (statusFilter !== "ALL") {
          params.status = statusFilter;
        }
        const response = await financialSupportApi.getRequests(params);
        setRequests(response.requests);
      } else if (activeTab === "my-requests") {
        const params: any = { requesterId: user?.id };
        if (statusFilter !== "ALL") {
          params.status = statusFilter;
        }
        const response = await financialSupportApi.getRequests(params);
        setMyRequests(response.requests);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load financial support requests");
    } finally {
      setLoading(false);
    }
  };

  const loadWalletBalance = async () => {
    try {
      const balance = await walletApi.getBalance();
      setWalletBalance(Number(balance.availableBalance));
    } catch (error) {
      console.error("Failed to load wallet balance:", error);
    }
  };

  const handleContribute = (request: FinancialSupportRequest) => {
    setSelectedRequest(request);
    setShowContributeModal(true);
  };

  const handleContributionSuccess = () => {
    setShowContributeModal(false);
    setSelectedRequest(null);
    loadData();
    loadWalletBalance();
    toast.success("Contribution successful! Thank you for supporting your fellow teacher.");
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    loadData();
    toast.success("Financial support request created successfully!");
  };

  const calculateProgress = (request: FinancialSupportRequest) => {
    return (request.amountReceived / request.amountNeeded) * 100;
  };

  const getStatusColor = (status: FinancialSupportRequest["status"]) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-500";
      case "PARTIALLY_FUNDED":
        return "bg-yellow-500";
      case "GOAL_REACHED":
        return "bg-green-500";
      case "CANCELLED":
        return "bg-gray-500";
      case "CLOSED":
        return "bg-gray-600";
      case "EXPIRED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatStatus = (status: FinancialSupportRequest["status"]) => {
    return status.replace(/_/g, " ");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Support Network</h1>
          <p className="text-gray-600 mt-1">
            Community-powered financial assistance for teachers in need
          </p>
        </div>
        <div className="flex gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Your Wallet</p>
                <p className="text-lg font-bold">{walletBalance.toFixed(2)} ETB</p>
              </div>
            </div>
          </Card>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Request Support
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
            <Heart className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter((r) => r.status === "OPEN" || r.status === "PARTIALLY_FUNDED").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Goals Reached</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter((r) => r.status === "GOAL_REACHED").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Requests</CardTitle>
            <Users className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Needed</CardTitle>
            <DollarSign className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests
                .filter((r) => r.status === "OPEN" || r.status === "PARTIALLY_FUNDED")
                .reduce((sum, r) => sum + (r.amountNeeded - r.amountReceived), 0)
                .toFixed(0)}{" "}
              ETB
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="my-requests">My Requests</TabsTrigger>
            <TabsTrigger value="my-contributions">My Contributions</TabsTrigger>
          </TabsList>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="OPEN">Open</option>
              <option value="PARTIALLY_FUNDED">Partially Funded</option>
              <option value="GOAL_REACHED">Goal Reached</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        {/* Discover Tab */}
        <TabsContent value="discover" className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <Heart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No financial support requests found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {requests.map((request) => (
                <FinancialSupportCard
                  key={request.id}
                  request={request}
                  onContribute={handleContribute}
                  currentUserId={user?.id || ""}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Requests Tab */}
        <TabsContent value="my-requests" className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading your requests...</p>
            </div>
          ) : myRequests.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <Heart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">You haven't created any financial support requests yet.</p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Request
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myRequests.map((request) => (
                <FinancialSupportCard
                  key={request.id}
                  request={request}
                  onContribute={handleContribute}
                  currentUserId={user?.id || ""}
                  isOwner={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Contributions Tab */}
        <TabsContent value="my-contributions" className="space-y-4">
          <Card className="py-12">
            <CardContent className="text-center">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Contribution history coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showCreateModal && (
        <CreateFinancialSupportModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {showContributeModal && selectedRequest && (
        <ContributeModal
          isOpen={showContributeModal}
          onClose={() => {
            setShowContributeModal(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
          walletBalance={walletBalance}
          onSuccess={handleContributionSuccess}
        />
      )}
    </div>
  );
}
