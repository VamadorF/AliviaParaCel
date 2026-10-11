import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { PlannedReminder } from '@/features/patient/notifications/reminders';

/**
 * Único módulo que habla con expo-notifications.
 * Los tests no lo importan: la decisión de qué programar vive en reminders.ts.
 * Solo avisos locales. No pide token de push ni registra un servidor.
 */

const CHANNEL_ID = 'recordatorios';

export type SyncResult = 'scheduled' | 'empty' | 'denied' | 'pending' | 'unavailable';

let handlerReady = false;
let queue: Promise<unknown> = Promise.resolve();

function ensureHandler() {
  if (handlerReady) return;
  handlerReady = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function syncBody(
  plan: PlannedReminder[],
  requestPermission: boolean,
): Promise<SyncResult> {
  if (Platform.OS === 'web') return 'unavailable';
  ensureHandler();

  if (plan.length === 0) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return 'empty';
  }

  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;
  let status = existing.status;
  if (!granted && requestPermission) {
    const asked = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });
    granted = asked.granted;
    status = asked.status;
  }
  if (!granted) {
    if (status !== 'denied') return 'pending';
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {
      // Sin permiso el sistema ya no los muestra.
    }
    return 'denied';
  }

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Recordatorios',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const item of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: item.id,
      content: {
        title: item.title,
        body: item.body,
        ...(item.url ? { data: { url: item.url } } : {}),
      },
      trigger:
        item.trigger.type === 'daily'
          ? {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: item.trigger.hour,
              minute: item.trigger.minute,
              channelId: CHANNEL_ID,
            }
          : {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: new Date(item.trigger.at),
              channelId: CHANNEL_ID,
            },
    });
  }
  return 'scheduled';
}

export function syncScheduledReminders(
  plan: PlannedReminder[],
  options: { requestPermission: boolean },
): Promise<SyncResult> {
  const run = queue.then(() => syncBody(plan, options.requestPermission));
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run.catch(() => 'unavailable' as const);
}

export async function clearLocalReminders() {
  try {
    if (Platform.OS === 'web') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Sin módulo nativo no hay avisos que cancelar.
  }
}
