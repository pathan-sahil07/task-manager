"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { format, isPast } from "date-fns";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { projectsApi, tasksApi, usersApi } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { StatusBadge, PriorityBadge, STATUS_CONFIG } from "@/components/Badges";
import {
  Plus,
  Trash2,
  X,
  Loader2,
  UserPlus,
  Clock,
  ChevronLeft,
  MoreVertical,
} from "lucide-react";

// ── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, canAdmin, members, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(task.status);
  const [saving, setSaving] = useState(false);
  const isOverdue =
    task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "DONE";

  const handleStatusChange = async (newStatus) => {
    setSaving(true);
    try {
      const { data } = await tasksApi.update(task.id, { status: newStatus });
      setStatus(newStatus);
      onUpdate(data);
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this task?")) return;
    try {
      await tasksApi.delete(task.id);
      onDelete(task.id);
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  };

  return (
    <div className={`bg-slate-800 rounded-xl p-3 border ${isOverdue ? "border-red-800/60" : "border-slate-700"}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-white flex-1">{task.title}</p>
        {canAdmin && (
          <button
            onClick={handleDelete}
            className="text-slate-600 hover:text-red-400 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {task.description && (
        <p className="text-xs text-slate-500 mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-2">
        <PriorityBadge priority={task.priority} />
      </div>

      {task.assignee && (
        <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
          <span className="w-4 h-4 rounded-full bg-blue-700 inline-flex items-center justify-center text-[9px] text-white font-bold">
            {task.assignee.name[0]}
          </span>
          {task.assignee.name}
        </p>
      )}

      {task.dueDate && (
        <p className={`text-xs flex items-center gap-1 mb-2 ${isOverdue ? "text-red-400" : "text-slate-500"}`}>
          <Clock size={11} />
          {isOverdue ? "Overdue · " : "Due "}
          {format(new Date(task.dueDate), "MMM d, yyyy")}
        </p>
      )}

      {/* Status selector */}
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={saving}
        className="w-full text-xs bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
      >
        {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </select>
    </div>
  );
}

// ── Create Task Modal ─────────────────────────────────────────────────────────
function CreateTaskModal({ projectId, members, onClose, onCreate }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "TODO",
    assigneeId: "",
    dueDate: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        projectId,
        assigneeId: form.assigneeId || undefined,
        dueDate: form.dueDate || undefined,
      };
      const { data } = await tasksApi.create(payload);
      toast.success("Task created!");
      onCreate(data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-200">
          <X size={18} />
        </button>
        <h2 className="text-lg font-semibold text-white mb-4">Create Task</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Title *</label>
            <input className="input" placeholder="Task title" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={2} placeholder="Details..."
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {Object.entries(STATUS_CONFIG).map(([v, { label }]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Assign to</label>
            <select className="input" value={form.assigneeId}
              onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Due date</label>
            <input type="date" className="input" value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Member Modal ──────────────────────────────────────────────────────────
function AddMemberModal({ projectId, existingMemberIds, onClose, onAdd }) {
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    usersApi.list().then((r) => {
      setAllUsers(r.data.filter((u) => !existingMemberIds.includes(u.id)));
    });
  }, []);

  const handleAdd = async () => {
    if (!selectedUserId) return toast.error("Select a user");
    setLoading(true);
    try {
      const { data } = await projectsApi.addMember(projectId, { userId: selectedUserId, role });
      toast.success("Member added!");
      onAdd(data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-sm relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-200">
          <X size={18} />
        </button>
        <h2 className="text-lg font-semibold text-white mb-4">Add Member</h2>
        <div className="space-y-3">
          <div>
            <label className="label">User</label>
            <select className="input" value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}>
              <option value="">Select a user</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleAdd} disabled={loading}>
              {loading ? "Adding..." : "Add Member"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [activeTab, setActiveTab] = useState("board");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !params.id) return;
    Promise.all([
      projectsApi.get(params.id),
      tasksApi.byProject(params.id),
    ])
      .then(([pRes, tRes]) => {
        setProject(pRes.data);
        setTasks(tRes.data);
      })
      .catch(() => toast.error("Failed to load project"))
      .finally(() => setLoading(false));
  }, [user, params.id]);

  if (authLoading || !user) return null;

  const myMembership = project?.members?.find((m) => m.user.id === user.id);
  const isProjectAdmin = user.role === "ADMIN" || myMembership?.role === "ADMIN";

  const tasksByStatus = Object.keys(STATUS_CONFIG).reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Back */}
        <button
          onClick={() => router.push("/projects")}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm mb-4 transition-colors"
        >
          <ChevronLeft size={15} /> Projects
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        ) : !project ? (
          <p className="text-slate-400">Project not found.</p>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                {project.description && (
                  <p className="text-slate-400 mt-1">{project.description}</p>
                )}
                <p className="text-sm text-slate-500 mt-1">
                  {tasks.length} task{tasks.length !== 1 ? "s" : ""} ·{" "}
                  {project.members.length} member{project.members.length !== 1 ? "s" : ""}
                </p>
              </div>
              {isProjectAdmin && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setShowMemberModal(true)}
                    className="btn-secondary flex items-center gap-1.5 text-sm"
                  >
                    <UserPlus size={14} /> Add Member
                  </button>
                  <button
                    onClick={() => setShowTaskModal(true)}
                    className="btn-primary flex items-center gap-1.5 text-sm"
                  >
                    <Plus size={14} /> New Task
                  </button>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-slate-800">
              {["board", "members"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? "border-blue-500 text-blue-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "board" && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(STATUS_CONFIG).map(([status, { label }]) => (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-400">{label}</span>
                      <span className="badge bg-slate-800 text-slate-500">
                        {tasksByStatus[status].length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {tasksByStatus[status].length === 0 ? (
                        <div className="border-2 border-dashed border-slate-800 rounded-xl p-4 text-center">
                          <p className="text-xs text-slate-600">No tasks</p>
                        </div>
                      ) : (
                        tasksByStatus[status].map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            canAdmin={isProjectAdmin}
                            members={project.members}
                            onUpdate={(updated) =>
                              setTasks(tasks.map((t) => (t.id === updated.id ? updated : t)))
                            }
                            onDelete={(id) => setTasks(tasks.filter((t) => t.id !== id))}
                          />
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "members" && (
              <div className="card max-w-lg">
                <h3 className="text-base font-semibold text-white mb-4">Team Members</h3>
                <div className="space-y-3">
                  {project.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                          {m.user.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{m.user.name}</p>
                          <p className="text-xs text-slate-500">{m.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${m.role === "ADMIN" ? "bg-blue-900/60 text-blue-300" : "bg-slate-700 text-slate-400"}`}>
                          {m.role}
                        </span>
                        {isProjectAdmin && m.user.id !== user.id && (
                          <button
                            onClick={async () => {
                              try {
                                await projectsApi.removeMember(project.id, m.user.id);
                                setProject({
                                  ...project,
                                  members: project.members.filter((x) => x.id !== m.id),
                                });
                                toast.success("Member removed");
                              } catch {
                                toast.error("Failed to remove member");
                              }
                            }}
                            className="text-slate-600 hover:text-red-400 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {showTaskModal && (
        <CreateTaskModal
          projectId={params.id}
          members={project?.members || []}
          onClose={() => setShowTaskModal(false)}
          onCreate={(task) => {
            setTasks([task, ...tasks]);
            setShowTaskModal(false);
          }}
        />
      )}

      {showMemberModal && (
        <AddMemberModal
          projectId={params.id}
          existingMemberIds={project?.members.map((m) => m.user.id) || []}
          onClose={() => setShowMemberModal(false)}
          onAdd={(member) => {
            setProject({ ...project, members: [...project.members, member] });
            setShowMemberModal(false);
          }}
        />
      )}
    </div>
  );
}
