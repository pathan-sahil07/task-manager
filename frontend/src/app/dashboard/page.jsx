"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, isPast } from "date-fns";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { tasksApi } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  TrendingUp,
  ListTodo,
  Loader2,
} from "lucide-react";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-slate-400 text-sm">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    tasksApi
      .dashboard()
      .then((r) => setStats(r.data))
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Good {greeting()}, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="text-slate-400 mt-1">
            {user.role === "ADMIN" ? "Here's an overview of all tasks" : "Here's your task overview"}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        ) : stats ? (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={ListTodo}
                label="Total Tasks"
                value={stats.total}
                color="bg-blue-600/20 text-blue-400"
              />
              <StatCard
                icon={TrendingUp}
                label="In Progress"
                value={stats.inProgress}
                color="bg-purple-600/20 text-purple-400"
              />
              <StatCard
                icon={CheckSquare}
                label="Completed"
                value={stats.done}
                color="bg-green-600/20 text-green-400"
              />
              <StatCard
                icon={AlertTriangle}
                label="Overdue"
                value={stats.overdue}
                color="bg-red-600/20 text-red-400"
              />
            </div>

            {/* Progress bars */}
            <div className="card mb-8">
              <h2 className="text-base font-semibold text-white mb-4">Task Status Overview</h2>
              <div className="space-y-3">
                {[
                  { label: "To Do", count: stats.todo, color: "bg-slate-500", total: stats.total },
                  { label: "In Progress", count: stats.inProgress, color: "bg-blue-500", total: stats.total },
                  { label: "In Review", count: stats.inReview, color: "bg-yellow-500", total: stats.total },
                  { label: "Done", count: stats.done, color: "bg-green-500", total: stats.total },
                ].map(({ label, count, color, total }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">{label}</span>
                      <span className="text-slate-300">{count}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-500`}
                        style={{ width: total ? `${(count / total) * 100}%` : "0%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent tasks */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Recent Tasks</h2>
                <Link href="/projects" className="text-sm text-blue-400 hover:text-blue-300">
                  View all projects →
                </Link>
              </div>

              {stats.recentTasks.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">No tasks yet</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start justify-between gap-3 p-3 bg-slate-800 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Link
                            href={`/projects/${task.project.id}`}
                            className="text-xs text-blue-400 hover:underline"
                          >
                            {task.project.name}
                          </Link>
                          {task.assignee && (
                            <span className="text-xs text-slate-500">· {task.assignee.name}</span>
                          )}
                        </div>
                        {task.dueDate && (
                          <p
                            className={`text-xs mt-1 flex items-center gap-1 ${
                              isPast(new Date(task.dueDate)) && task.status !== "DONE"
                                ? "text-red-400"
                                : "text-slate-500"
                            }`}
                          >
                            <Clock size={11} />
                            Due {format(new Date(task.dueDate), "MMM d")}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <StatusBadge status={task.status} />
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}
