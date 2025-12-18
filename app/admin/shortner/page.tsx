"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Check, Edit, Trash2, Plus, Loader2, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface ShortnerServer {
  _id?: string;
  name: string;
  enabled: boolean;
  api_url: string;
  api_key: string;
}

export default function ShortnerAdminPage() {
  const [servers, setServers] = useState<ShortnerServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newServer, setNewServer] = useState<ShortnerServer>({
    name: "",
    enabled: true,
    api_url: "",
    api_key: "",
  });
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editServer, setEditServer] = useState<ShortnerServer | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  // Fetch current shortner servers
  useEffect(() => {
    // Directly fetch — no localStorage needed
    fetch("/api/admin/adminServer", {
      credentials: "include", // Automatically sends cookies
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        setServers(data.serverConfig?.shortner_servers || []);
        setAuthChecked(true);
        setLoading(false);
      })
      .catch((error) => {
        console.error("API Error:", error);
        // You can't remove cookie here, just redirect
        router.replace("/admin/login");
      });
  }, [router]);

  // Save changes to serverconfig
  const saveServers = async (updatedServers: ShortnerServer[]) => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/adminServer", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ✅ Important: sends HTTP-only cookie
        body: JSON.stringify({ shortner_servers: updatedServers }),
      });

      if (response.ok) {
        setServers(updatedServers);
        toast.success("Shortner servers updated");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update shortner servers");
      }
    } catch (error) {
      toast.error("An error occurred while updating shortner servers");
    } finally {
      setLoading(false);
      setEditingIndex(null);
      setNewServer({ name: "", enabled: true, api_url: "", api_key: "" });
    }
  };

  // Add new server
  const handleAdd = () => {
    if (!newServer.name || !newServer.api_url || !newServer.api_key) {
      toast.error("All fields are required");
      return;
    }
    const updated = [...servers, { ...newServer, _id: undefined }];
    saveServers(updated);
  };

  // Open edit modal
  const handleEdit = (index: number) => {
    setEditServer(servers[index]);
    setEditingIndex(index);
    setEditModalOpen(true);
  };

  // Save edit from modal
  const handleSaveEdit = () => {
    if (!editServer?.name || !editServer.api_url || !editServer.api_key) {
      toast.error("All fields are required");
      return;
    }
    const updated = servers.map((s, i) => (i === editingIndex ? editServer : s));
    saveServers(updated);
    setEditModalOpen(false);
    setEditServer(null);
    setEditingIndex(null);
  };

  // Delete server
  const handleDelete = (index: number) => {
    if (!window.confirm("Are you sure you want to delete this server?")) return;
    const updated = servers.filter((_, i) => i !== index);
    saveServers(updated);
  };

  if (!authChecked && loading) return null;

  return (
    <AdminLayout activePage="shortner">
      <div className="p-4 lg:p-8 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-8 text-center text-black drop-shadow-sm">Shortner Servers</h1>
        <Card className="p-8 mb-10 shadow-lg border-indigo-100 border-2 bg-gradient-to-br from-white to-indigo-50">
          <div className="flex items-center mb-6 gap-3">
            <Plus className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-semibold text-black">Add New Shortner Server</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <Label>Name</Label>
              <Input
                value={newServer.name}
                onChange={e => setNewServer({ ...newServer, name: e.target.value })}
                placeholder="Server Name"
                className="mt-1"
              />
            </div>
            <div>
              <Label>API URL</Label>
              <Input
                value={newServer.api_url}
                onChange={e => setNewServer({ ...newServer, api_url: e.target.value })}
                placeholder="https://..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>API Key</Label>
              <Input
                value={newServer.api_key}
                onChange={e => setNewServer({ ...newServer, api_key: e.target.value })}
                placeholder="API Key"
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <Switch
                checked={newServer.enabled}
                onCheckedChange={checked => setNewServer({ ...newServer, enabled: checked })}
              />
              <span className={newServer.enabled ? "text-green-600" : "text-gray-400"}>
                {newServer.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
          <div className="flex gap-3 mt-2">
            <Button onClick={handleAdd} disabled={loading} className="bg-gray-700 hover:bg-black text-white flex items-center gap-2 w-full md:w-auto">
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4" />} Add Server
            </Button>
          </div>
        </Card>
        <Card className="p-8 shadow-lg border-indigo-100 border-2 bg-gradient-to-br from-white to-indigo-50">
          <div className="flex items-center mb-6 gap-3">
            <Layers className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">Existing Shortner Servers</h2>
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="animate-spin w-8 h-8 text-gray-500" />
            </div>
          ) : servers.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No shortner servers configured.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <AnimatePresence>
                {servers.map((server, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.25 }}
                    className={`flex flex-col gap-3 border rounded-xl p-6 shadow-sm bg-white hover:shadow-md transition-shadow duration-200 ${server.enabled ? "border-green-200" : "border-gray-200"}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-lg text-gray-800 truncate">{server.name}</span>
                        {server.enabled && <span className="ml-2 px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">Enabled</span>}
                        {!server.enabled && <span className="ml-2 px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-500">Disabled</span>}
                      </div>
                      <div className="text-xs text-gray-500 break-all mb-1">API URL: <span className="font-mono">{server.api_url}</span></div>
                      <div className="text-xs text-gray-500 break-all mb-1">API Key: <span className="font-mono">{server.api_key}</span></div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Dialog open={editModalOpen && editingIndex === i} onOpenChange={open => { setEditModalOpen(open); if (!open) { setEditServer(null); setEditingIndex(null); } }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon" className="hover:border-gray-400 w-10 h-10" onClick={() => handleEdit(i)}>
                            <Edit className="w-4 h-4 text-gray-600" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md w-full">
                          <DialogHeader>
                            <DialogTitle>Edit Shortner Server</DialogTitle>
                            <DialogDescription>Update the details for this shortner server.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-2">
                            <div>
                              <Label>Name</Label>
                              <Input
                                value={editServer?.name || ""}
                                onChange={e => setEditServer({ ...editServer!, name: e.target.value })}
                                placeholder="Server Name"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>API URL</Label>
                              <Input
                                value={editServer?.api_url || ""}
                                onChange={e => setEditServer({ ...editServer!, api_url: e.target.value })}
                                placeholder="https://..."
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>API Key</Label>
                              <Input
                                value={editServer?.api_key || ""}
                                onChange={e => setEditServer({ ...editServer!, api_key: e.target.value })}
                                placeholder="API Key"
                                className="mt-1"
                              />
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Switch
                                checked={editServer?.enabled || false}
                                onCheckedChange={checked => setEditServer({ ...editServer!, enabled: checked })}
                              />
                              <span className={editServer?.enabled ? "text-green-600" : "text-gray-400"}>
                                {editServer?.enabled ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                          </div>
                          <DialogFooter className="mt-4">
                            <Button onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
                              <Check className="w-4 h-4" /> Save
                            </Button>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" className="hover:border-red-400 w-10 h-10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Shortner Server</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <span className="font-semibold">{server.name}</span>? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(i)} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
} 