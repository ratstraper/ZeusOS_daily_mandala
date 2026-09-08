import { set as setAlarm } from "@zos/alarm";

const HALF_HOUR_SECONDS = 30 * 60;

/**
 * Запланировать показ уведомления через 30 минут.
 */
export function scheduleNotification(item) {
    if(!item || !item.title || !item.content) {
        const title = String(item.title);
        const content = String(item.content);
        const param = JSON.stringify({
            title,
            content,
        });

        const alarmId = setAlarm({
            url: "app-service/delayedNewsService",
            delay: HALF_HOUR_SECONDS,
            param,
            store: true, //сохранится даже после перезагрузки часов
        });

        console.log(`[alarm] created id=${alarmId}`);

        if (alarmId === 0) {
            console.log("[alarm] alarm creation failed");
        }
        return alarmId;
    }
    return 0;
}