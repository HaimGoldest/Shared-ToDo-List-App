import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { Task, TaskService } from '../../services/task.service';
import { WebSocketService } from '../../services/websocket.service';
import { takeUntil, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent implements OnInit, OnDestroy {
  public tasks: Task[] = [];
  public activeEditModeIndex: number | null = null;
  private destroy$ = new Subject<void>();
  public username: string;
  public newTask: Task;

  constructor(
    private taskService: TaskService,
    private wsService: WebSocketService,
    private authService: AuthService,
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router
  ) {
    this.username = localStorage.getItem('username');
    this.newTask = {
      title: '',
      isLocked: false,
      completed: false,
      createdAt: Date.now().toString(),
      createdBy: this.username,
      updatedAt: Date.now().toString(),
    };
  }

  public ngOnInit(): void {
    this.loadTasks();
    this.listenForUpdates();
    this.changeDetectorRef.detectChanges();
  }

  public ngOnDestroy(): void {
    this.releaseLockedTasks();
    this.destroy$.next();
    this.destroy$.complete();
  }

  public onEditModeOpened(index: number) {
    this.activeEditModeIndex = index;
  }

  public onUpdateTask(task: Task): void {
    this.taskService
      .updateTask(task._id!, task)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  public onDeleteTask(task: Task): void {
    this.taskService
      .deleteTask(task._id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  public onAddTask(): void {
    if (this.newTask.title.trim()) {
      this.taskService.createTask(this.newTask).subscribe(() => {
        this.newTask.title = '';
        this.changeDetectorRef.markForCheck();
      });
    }
  }

  private loadTasks(): void {
    this.taskService
      .getTasks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tasks) => {
          this.tasks = [...tasks];
          this.changeDetectorRef.markForCheck();
        },
        error: (err) => {
          this.authService.logout();
          console.error('Error fetching tasks', err);
          this.router.navigate(['/login']);
        },
      });
  }

  private listenForUpdates(): void {
    this.wsService
      .listen('taskUpdated')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        switch (data.type) {
          case 'create':
            if (!this.tasks.find((task) => task._id === data.task._id)) {
              this.tasks = [...this.tasks, data.task];
            }
            break;

          case 'update':
            const index = this.tasks.findIndex(
              (task) => task._id === data.task._id
            );
            if (index !== -1) {
              this.tasks[index] = data.task;
            } else {
              this.tasks = [...this.tasks, data.task];
            }
            break;

          case 'delete':
            this.tasks = this.tasks.filter((task) => task._id !== data.taskId);
            break;
        }
        this.changeDetectorRef.markForCheck();
      });
  }

  private releaseLockedTasks() {
    this.tasks.forEach((t) => {
      if (t.lockedBy === this.username) {
        t.isLocked = false;
        t.lockedBy = null;
        this.onUpdateTask(t);
      }
    });
  }
}
