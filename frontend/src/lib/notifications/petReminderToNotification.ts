import type { PetHealthReminderDto } from "@/types/petHealth";
import { HEALTH_RECORD_TYPE_LABELS } from "@/types/petHealth";
import type { AppNotification } from "@/types/notification";

function todayLocalIso(): string {
  const d = new Date();
  d.setHours(8, 0, 0, 0);
  return d.toISOString();
}

function isOverdue(dueDate: string): boolean {
  const due = new Date(`${dueDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

export function petReminderToNotification(reminder: PetHealthReminderDto): AppNotification {
  const typeLabel = HEALTH_RECORD_TYPE_LABELS[reminder.reminderType] ?? reminder.reminderType;
  const petName = reminder.petName?.trim() || "Thú cưng";
  const overdue = isOverdue(reminder.dueDate);

  return {
    id: `pet-reminder-${reminder.id}`,
    kind: "pet_reminder",
    title: overdue ? "Nhắc nhở quá hạn" : "Nhắc nhở hôm nay",
    body: overdue
      ? `${petName}: ${reminder.title} (${typeLabel}) — đã quá hạn`
      : `${petName}: ${reminder.title} (${typeLabel})`,
    petId: reminder.petId,
    reminderId: reminder.id,
    occurredAt: todayLocalIso(),
    read: false,
    actionable: true,
  };
}

export function dueRemindersToNotifications(reminders: PetHealthReminderDto[]): AppNotification[] {
  return reminders.map(petReminderToNotification);
}
