import {
  Component,
  ChangeDetectionStrategy,
  EventEmitter,
  Input,
  Output,
  OnDestroy,
} from '@angular/core';
import { Task } from '../../services/task.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-task-item',
  templateUrl: './task-item.component.html',
  styleUrls: ['./task-item.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskItemComponent implements OnDestroy {
  @Input() task!: Task;
  @Input() index: number | undefined;
  @Input() activeEditModeIndex: number | null = null;
  @Output() updateTask = new EventEmitter<Task>();
  @Output() deleteTask = new EventEmitter<Task>();
  @Output() editModeOpened = new EventEmitter<number>();

  private destroy$ = new Subject<void>();
  private username: string;

  get isLocked(): boolean {
    return this.task.isLocked && this.task.lockedBy !== this.username;
  }

  get wasUpdated(): boolean {
    return this.task.createdAt !== this.task.updatedAt;
  }

  public ngOnInit(): void {
    this.username = localStorage.getItem('username');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public onStartEditMode(event?: MouseEvent): void {
    if (event) event.preventDefault();

    if (this.index !== undefined) {
      this.editModeOpened.emit(this.index);
    }

    this.lockUser();
    this.emitUpdate();
  }

  public onCancelEdit(): void {
    this.onEndEditMode();
  }

  public onEditSubmit(newTitle: string): void {
    this.task.title = newTitle;
    this.setUpdatedParams();
    this.onEndEditMode();
  }

  public onToggleCompletion(): void {
    this.task.completed = !this.task.completed;
    this.setUpdatedParams();
    this.emitUpdate();
  }

  public onDelete(): void {
    this.editModeOpened.emit(null);
    this.deleteTask.emit(this.task);
  }

  private onEndEditMode(): void {
    this.editModeOpened.emit(null);
    this.unlockUser();
    this.emitUpdate();
  }

  private lockUser(): void {
    if (this.username) {
      this.task.isLocked = true;
      this.task.lockedBy = this.username;
    }
  }

  private unlockUser(): void {
    this.task.isLocked = false;
    this.task.lockedBy = null;
  }

  private emitUpdate(): void {
    this.updateTask.next({ ...this.task });
  }

  private setUpdatedParams(): void {
    this.task.updatedAt = Date.now().toString();
    this.task.updatedBy = this.username;
  }
}
