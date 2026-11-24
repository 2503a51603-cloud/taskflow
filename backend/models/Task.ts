import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface ITask {
  title: string;
  description: string;
  dueDate: Date;
  dueTime: string;
  priority: TaskPriority;
  category: string;
  tags: string[];
  status: TaskStatus;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskDocument extends ITask, Document {}

export const TASK_PRIORITIES: readonly TaskPriority[] = ['Low', 'Medium', 'High'];
export const TASK_STATUSES: readonly TaskStatus[] = ['Pending', 'In Progress', 'Completed'];

const taskSchema = new Schema<TaskDocument>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [2, 'Task title must be at least 2 characters'],
      maxlength: [140, 'Task title cannot exceed 140 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    dueTime: {
      type: String,
      default: '23:59',
      trim: true,
      validate: {
        validator: (value: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value),
        message: 'Due time must be in HH:MM (24-hour) format',
      },
    },
    priority: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High'],
        message: 'Priority must be Low, Medium, or High',
      },
      default: 'Medium',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: 'Academic',
      maxlength: [50, 'Category cannot exceed 50 characters'],
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (arr: string[]) => arr.length <= 10,
        message: 'A task can have at most 10 tags',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'In Progress', 'Completed'],
        message: 'Status must be Pending, In Progress, or Completed',
      },
      default: 'Pending',
    },
    progress: {
      type: Number,
      min: [0, 'Progress cannot be less than 0%'],
      max: [100, 'Progress cannot exceed 100%'],
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ dueDate: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ category: 1 });

export const Task: Model<TaskDocument> =
  (mongoose.models.Task as Model<TaskDocument> | undefined) ||
  mongoose.model<TaskDocument>('Task', taskSchema);
