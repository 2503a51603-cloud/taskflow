import fs from 'fs/promises';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDBStatus } from '../config/db.ts';
import { Task, type TaskPriority, type TaskStatus } from '../models/Task.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const JSON_FILE_PATH = path.join(DATA_DIR, 'tasks.json');

export interface StoredTask {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  priority: TaskPriority;
  category: string;
  tags: string[];
  status: TaskStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskQueryFilters {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string;
  tag?: string;
  dueDate?: string;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  dueDate: Date | string;
  dueTime: string;
  priority: TaskPriority;
  category: string;
  tags: string[];
  status: TaskStatus;
  progress: number;
}

export type StorageMode = 'mongodb' | 'json';

let writeQueue: Promise<void> = Promise.resolve();

function serializeWrite<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(fn, fn);
  writeQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

async function ensureJsonStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(JSON_FILE_PATH);
  } catch {
    await fs.writeFile(JSON_FILE_PATH, '[]\n', 'utf8');
  }
}

async function readJsonTasks(): Promise<StoredTask[]> {
  await ensureJsonStore();
  const raw = await fs.readFile(JSON_FILE_PATH, 'utf8');
  if (!raw.trim()) return [];
  const parsed = JSON.parse(raw) as unknown;
  return Array.isArray(parsed) ? (parsed as StoredTask[]) : [];
}

async function writeJsonTasks(tasks: StoredTask[]): Promise<void> {
  await ensureJsonStore();
  const tempPath = `${JSON_FILE_PATH}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(tasks, null, 2)}\n`, 'utf8');
  await fs.rename(tempPath, JSON_FILE_PATH);
}

function normalizeMongoDoc(doc: {
  _id: unknown;
  title: string;
  description: string;
  dueDate: Date | string;
  dueTime: string;
  priority: TaskPriority;
  category: string;
  tags: string[];
  status: TaskStatus;
  progress: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}): StoredTask {
  return {
    _id: String(doc._id),
    title: doc.title,
    description: doc.description ?? '',
    dueDate:
      doc.dueDate instanceof Date
        ? doc.dueDate.toISOString()
        : String(doc.dueDate),
    dueTime: doc.dueTime || '23:59',
    priority: doc.priority,
    category: doc.category,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    status: doc.status,
    progress: doc.progress,
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : String(doc.createdAt),
    updatedAt:
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : String(doc.updatedAt),
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getActiveStorageMode(): StorageMode {
  return getDBStatus().connected ? 'mongodb' : 'json';
}

export async function findTasks(
  filters: TaskQueryFilters = {}
): Promise<StoredTask[]> {
  if (getActiveStorageMode() === 'mongodb') {
    const query: Record<string, unknown> = {};

    if (filters.search) {
      const safePattern = new RegExp(escapeRegex(filters.search), 'i');
      query.$or = [
        { title: safePattern },
        { description: safePattern },
        { category: safePattern },
        { tags: safePattern },
      ];
    }
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.category) query.category = filters.category;
    if (filters.tag) query.tags = filters.tag;
    if (filters.dueDate) {
      query.dueDate = {
        $gte: new Date(`${filters.dueDate}T00:00:00.000Z`),
        $lte: new Date(`${filters.dueDate}T23:59:59.999Z`),
      };
    }

    const docs = await Task.find(query).sort({ dueDate: 1, dueTime: 1 }).lean();
    return docs.map(normalizeMongoDoc);
  }

  let tasks = await readJsonTasks();

  if (filters.search) {
    const needle = filters.search.toLowerCase();
    tasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(needle) ||
        t.description.toLowerCase().includes(needle) ||
        t.category.toLowerCase().includes(needle) ||
        t.tags.some((tag) => tag.toLowerCase().includes(needle))
    );
  }

  if (filters.status) {
    tasks = tasks.filter((t) => t.status === filters.status);
  }
  if (filters.priority) {
    tasks = tasks.filter((t) => t.priority === filters.priority);
  }
  if (filters.category) {
    tasks = tasks.filter((t) => t.category === filters.category);
  }
  if (filters.tag) {
    tasks = tasks.filter((t) => t.tags.includes(filters.tag!));
  }
  if (filters.dueDate) {
    tasks = tasks.filter((t) => t.dueDate.slice(0, 10) === filters.dueDate);
  }

  return tasks;
}

export async function findAllTasks(): Promise<StoredTask[]> {
  return findTasks({});
}

export async function findTaskById(id: string): Promise<StoredTask | null> {
  if (getActiveStorageMode() === 'mongodb') {
    const doc = await Task.findById(id).lean();
    return doc ? normalizeMongoDoc(doc) : null;
  }

  const tasks = await readJsonTasks();
  return tasks.find((t) => t._id === id) ?? null;
}

export async function createTaskRecord(
  input: CreateTaskInput
): Promise<StoredTask> {
  if (getActiveStorageMode() === 'mongodb') {
    const created = await Task.create(input);
    return normalizeMongoDoc(created);
  }

  return serializeWrite(async () => {
    const tasks = await readJsonTasks();
    const nowIso = new Date().toISOString();
    const dueIso =
      input.dueDate instanceof Date
        ? input.dueDate.toISOString()
        : new Date(input.dueDate).toISOString();

    const record: StoredTask = {
      _id: new mongoose.Types.ObjectId().toString(),
      title: input.title,
      description: input.description,
      dueDate: dueIso,
      dueTime: input.dueTime,
      priority: input.priority,
      category: input.category,
      tags: input.tags,
      status: input.status,
      progress: input.progress,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    tasks.push(record);
    await writeJsonTasks(tasks);
    return record;
  });
}

export async function updateTaskRecord(
  id: string,
  updates: Partial<CreateTaskInput>
): Promise<StoredTask | null> {
  if (getActiveStorageMode() === 'mongodb') {
    const existing = await Task.findById(id);
    if (!existing) return null;

    Object.assign(existing, updates);
    applyStatusProgressSync(existing, updates);
    const saved = await existing.save();
    return normalizeMongoDoc(saved);
  }

  return serializeWrite(async () => {
    const tasks = await readJsonTasks();
    const idx = tasks.findIndex((t) => t._id === id);
    if (idx === -1) return null;

    const current = { ...tasks[idx] };
    if (updates.title !== undefined) current.title = updates.title;
    if (updates.description !== undefined) current.description = updates.description;
    if (updates.dueDate !== undefined) {
      current.dueDate =
        updates.dueDate instanceof Date
          ? updates.dueDate.toISOString()
          : new Date(updates.dueDate).toISOString();
    }
    if (updates.dueTime !== undefined) current.dueTime = updates.dueTime;
    if (updates.priority !== undefined) current.priority = updates.priority;
    if (updates.category !== undefined) current.category = updates.category;
    if (updates.tags !== undefined) current.tags = updates.tags;
    if (updates.status !== undefined) current.status = updates.status;
    if (updates.progress !== undefined) current.progress = updates.progress;

    applyStatusProgressSync(current, updates);
    current.updatedAt = new Date().toISOString();

    tasks[idx] = current;
    await writeJsonTasks(tasks);
    return current;
  });
}

function applyStatusProgressSync(
  target: { status: TaskStatus; progress: number },
  updates: Partial<CreateTaskInput>
) {
  if (updates.status === 'Completed') {
    target.progress = 100;
  } else if (updates.status === 'Pending' && updates.progress === undefined) {
    target.progress = 0;
  } else if (updates.progress === 100 && updates.status === undefined) {
    target.status = 'Completed';
  } else if (
    typeof updates.progress === 'number' &&
    updates.progress > 0 &&
    updates.progress < 100 &&
    updates.status === undefined &&
    target.status !== 'In Progress'
  ) {
    target.status = 'In Progress';
  }
}

export async function deleteTaskRecord(id: string): Promise<string | null> {
  if (getActiveStorageMode() === 'mongodb') {
    const deleted = await Task.findByIdAndDelete(id);
    return deleted ? String(deleted._id) : null;
  }

  return serializeWrite(async () => {
    const tasks = await readJsonTasks();
    const idx = tasks.findIndex((t) => t._id === id);
    if (idx === -1) return null;

    const [removed] = tasks.splice(idx, 1);
    await writeJsonTasks(tasks);
    return removed._id;
  });
}

function offsetDate(days: number): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days)
  );
}

export function getSampleTasks(): CreateTaskInput[] {
  return [
    {
      title: 'Submit DBMS Normalization Lab Report',
      description:
        'Complete ER-to-relational schema conversion and BCNF proofs for Experiment 5 in SQL Lab manual.',
      dueDate: offsetDate(0),
      dueTime: '17:00',
      priority: 'High',
      category: 'Coursework',
      tags: ['DBMS', 'Lab', 'Submission'],
      status: 'In Progress',
      progress: 70,
    },
    {
      title: 'OS CPU Scheduling Simulator Code',
      description:
        'Implement FCFS, SJF, and Round Robin scheduling algorithms in C++ and record average turnaround times.',
      dueDate: offsetDate(1),
      dueTime: '23:59',
      priority: 'High',
      category: 'Assignments',
      tags: ['Operating Systems', 'C++'],
      status: 'In Progress',
      progress: 45,
    },
    {
      title: 'DSA Graph Traversal Practice Sheet',
      description:
        'Solve BFS, DFS, Dijkstra, and Topological Sort problems for internal assessment revision.',
      dueDate: offsetDate(3),
      dueTime: '20:00',
      priority: 'Medium',
      category: 'Exam Prep',
      tags: ['DSA', 'Algorithms'],
      status: 'Pending',
      progress: 0,
    },
    {
      title: 'Computer Networks TCP/UDP Wireshark Lab',
      description:
        'Capture packet traces for HTTP and DNS queries and attach annotated screenshots to lab record.',
      dueDate: offsetDate(-1),
      dueTime: '14:00',
      priority: 'High',
      category: 'Coursework',
      tags: ['Networks', 'Lab'],
      status: 'In Progress',
      progress: 60,
    },
    {
      title: 'Minor Project Mid-Sem Slides',
      description:
        'Prepare architecture diagram, ER model, and API endpoint documentation for faculty review.',
      dueDate: offsetDate(2),
      dueTime: '11:30',
      priority: 'Medium',
      category: 'Projects',
      tags: ['BTech Project', 'Presentation'],
      status: 'Pending',
      progress: 0,
    },
    {
      title: 'Software Engineering SRS Document',
      description:
        'Finalize functional requirements, use-case diagrams, and test cases per IEEE 830 template.',
      dueDate: offsetDate(-2),
      dueTime: '18:00',
      priority: 'Low',
      category: 'Assignments',
      tags: ['SE', 'Documentation'],
      status: 'Completed',
      progress: 100,
    },
  ];
}

export async function seedTasksIfEmpty(): Promise<{
  inserted: number;
  existing: number;
  storageMode: StorageMode;
}> {
  const mode = getActiveStorageMode();
  const existing = await findAllTasks();
  if (existing.length > 0) {
    return { inserted: 0, existing: existing.length, storageMode: mode };
  }

  const samples = getSampleTasks();
  if (mode === 'mongodb') {
    await Task.insertMany(samples);
    return { inserted: samples.length, existing: 0, storageMode: mode };
  }

  for (const item of samples) {
    await createTaskRecord(item);
  }
  return { inserted: samples.length, existing: 0, storageMode: mode };
}

export async function getJsonTaskCount(): Promise<number> {
  try {
    const tasks = await readJsonTasks();
    return tasks.length;
  } catch {
    return 0;
  }
}

export async function syncJsonTasksToMongo(): Promise<{
  migrated: number;
  skipped: number;
}> {
  if (getActiveStorageMode() !== 'mongodb') {
    throw new Error('Connect to MongoDB Atlas first before syncing JSON tasks.');
  }

  const jsonTasks = await readJsonTasks();
  if (jsonTasks.length === 0) {
    return { migrated: 0, skipped: 0 };
  }

  let migrated = 0;
  let skipped = 0;

  for (const item of jsonTasks) {
    const exists = await Task.exists({
      title: item.title,
      dueDate: new Date(item.dueDate),
      dueTime: item.dueTime,
    });
    if (exists) {
      skipped++;
      continue;
    }

    await Task.create({
      title: item.title,
      description: item.description,
      dueDate: new Date(item.dueDate),
      dueTime: item.dueTime,
      priority: item.priority,
      category: item.category,
      tags: item.tags,
      status: item.status,
      progress: item.progress,
    });
    migrated++;
  }

  return { migrated, skipped };
}
