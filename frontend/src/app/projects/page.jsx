"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { projectsApi } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Plus, FolderKanban, Users, CheckSquare, Loader2, X } from "lucide-react";

function CreateProjectModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await projectsApi.create(form);
      toast.success("Project created!");
      onCreate(data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
        >
          <X size={18} />
        </button>
        <h2 className="text-lg font-semibold text-white mb-4">New Project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Project name *</label>
            <input
              className="input"
              placeholder="e.g. Website Redesign"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="What is this project about?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    projectsApi
      .list()
      .then((r) => setProjects(r.data))
      .catch(() => toast.error("Failed to load projects"))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="text-slate-400 mt-1">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            New Project
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        ) : projects.length === 0 ? (
          <div className="card text-center py-16">
            <FolderKanban size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 font-medium">No projects yet</p>
            <p className="text-slate-500 text-sm mt-1">Create your first project to get started</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary mt-4 inline-flex items-center gap-2"
            >
              <Plus size={16} />
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="card hover:border-slate-600 hover:bg-slate-800/70 transition-all cursor-pointer group h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                      <FolderKanban size={18} className="text-blue-400" />
                    </div>
                    <span className="text-xs text-slate-500">
                      {format(new Date(project.createdAt), "MMM d")}
                    </span>
                  </div>

                  <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors mb-1">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-slate-400 text-sm line-clamp-2 mb-3">
                      {project.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-auto pt-3 border-t border-slate-800 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <CheckSquare size={13} />
                      {project._count.tasks} tasks
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={13} />
                      {project._count.members} members
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2">
                    by {project.owner.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onCreate={(p) => {
            setProjects([p, ...projects]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
