import * as hmUI from "@zos/ui";
import { getText as i18n } from "@zos/i18n";
import { log as Logger, px } from "@zos/utils";
import { BasePage } from "@zeppos/zml/base-page";
import { scheduleNotification } from "../utils/ScheduleNotification";
import { onKey, offKey, KEY_UP, KEY_DOWN, KEY_SELECT, KEY_EVENT_CLICK } from '@zos/interaction';
import { scrollTo } from '@zos/page';
import { push } from '@zos/router';
import { DEVICE_WIDTH, DEVICE_HEIGHT } from '../utils/config/device'
import { WEBSITE_URL, NORMAL_COLOR, PRESSED_COLOR, STORAGE_KEYS } from '../utils/config/constants';
import Profile from "../utils/config/profile.js";
import AppStorage from "../utils/config/storage";

import { FETCH_RESULT_TEXT, TITLE } from "zosLoader:./index.[pf].layout.js";


const logger = Logger.getLogger("mandala_day");

const SLIDES_MAIN = [
  {
    titleKey: "help_main_slide1_title",
    textKey: "help_main_slide1_text",
  },
  {
    titleKey: "help_main_slide2_title",
    textKey: "help_main_slide2_text",
  },
  {
    titleKey: "help_main_slide3_title",
    textKey: "help_main_slide3_text",
    action: {
      labelKey: "help_main_slide3_action",
      url: WEBSITE_URL,
    },
  },
];

Page(
  BasePage({
    state: {
      selectedIndex: -1, // -1 означает, что курсор ни на чем не стоит
      bgRects: [],       // Сюда сложим все фоны кнопок для управления цветом
      menuItems: [],     // Данные меню
      helpItem: null     // Данные для экрана помощи
    },
    widgets: {
      title: null,
      text: null,
      btn: null,
      questionImg: null
    },
    build() {
      logger.log(`INDEX.JS`);
      logger.log(`DEVICE_WIDTH=${DEVICE_WIDTH}, DEVICE_HEIGHT=${DEVICE_HEIGHT}`);
      this.layout = this.createLayout();
      this.loadNews();

      this.buildTitle();

      this.state.menuItems = [
        { id: 'practice', title: i18n("practice"), icon: 'icons/ic_daily.png' },
        { id: 'collection', title: i18n("collection"), icon: 'icons/ic_collection.png' },
      ];
      this.state.helpItem = { id: 'help', title: i18n("global_help_title"), params: JSON.stringify({ slides: SLIDES_MAIN }) };
      const questionIndex = this.state.menuItems.length;

      // 3. Функция, которая красит нужную кнопку и сбрасывает остальные
      const updateSelection = () => {
        this.state.bgRects.forEach((rect, idx) => {
          rect.setProperty(hmUI.prop.COLOR, idx === this.state.selectedIndex ? PRESSED_COLOR : NORMAL_COLOR);
        });

        if (this.widgets.questionImg) {
          const isQuestionSelected = this.state.selectedIndex === questionIndex;
          this.widgets.questionImg.setProperty(
            hmUI.prop.SRC,
            isQuestionSelected ? 'icons/question_64.png' : 'icons/question_64bw.png'
          );
        }
      };

      // 3. Умная функция центрирования камеры на нужной кнопке
      const scrollToItem = (index) => {
        if (index === -1) return;

        let itemY, itemH;

        if (index < questionIndex) {
          itemY = this.layout.startY + index * (this.layout.buttonHeight + this.layout.spacing);
          itemH = this.layout.buttonHeight;
        } else {
          itemY = this.layout.startY + questionIndex * (this.layout.buttonHeight + this.layout.spacing) + this.layout.spacing;
          itemH = px(64);
        }

        let targetY = itemY + (itemH / 2) - (DEVICE_HEIGHT / 2);
        if (targetY < 0) targetY = 0;

        scrollTo({
          y: -targetY,
          animConfig: { anim_duration: 250 }
        });
      };

      // 4. Отрисовываем кнопки в цикле
      this.state.menuItems.forEach((item, index) => {
        const yPos = this.layout.startY + index * (this.layout.buttonHeight + this.layout.spacing);

        const btnGroup = hmUI.createWidget(hmUI.widget.GROUP, {
          x: this.layout.startX, y: yPos, w: this.layout.buttonWidth, h: this.layout.buttonHeight
        });

        const bgRect = btnGroup.createWidget(hmUI.widget.FILL_RECT, {
          x: 0, y: 0, w: this.layout.buttonWidth, h: this.layout.buttonHeight,
          color: NORMAL_COLOR, radius: px(63)
        });

        this.state.bgRects.push(bgRect);

        btnGroup.createWidget(hmUI.widget.IMG, {
          x: px(24), y: (this.layout.buttonHeight - px(60)) / 2, w: px(60), h: px(60), src: item.icon
        });

        btnGroup.createWidget(hmUI.widget.TEXT, {
          x: px(104), y: 0, w: this.layout.buttonWidth - px(140), h: this.layout.buttonHeight,
          color: 0xffffff, text_size: px(36), align_h: hmUI.align.LEFT, align_v: hmUI.align.CENTER_V,
          text: item.title
        });

        btnGroup.createWidget(hmUI.widget.IMG, {
          x: this.layout.buttonWidth - px(84), y: (this.layout.buttonHeight - px(64)) / 2, w: px(64), h: px(64), src: 'icons/arrow_right.tga'
        });

        // --- Сенсорная логика синхронизируется с индексом ---
        btnGroup.addEventListener(hmUI.event.CLICK_DOWN, () => {
          this.state.selectedIndex = index;
          updateSelection();
        });
        btnGroup.addEventListener(hmUI.event.MOVE, () => {
          this.state.selectedIndex = -1;
          updateSelection();
        });
        btnGroup.addEventListener(hmUI.event.CLICK_UP, () => {
          if (this.state.selectedIndex === index) {
            this.state.selectedIndex = -1;
            updateSelection();
            this.executeAction(item);
          }
        });
      });

      const questionY = this.layout.startY + questionIndex * (this.layout.buttonHeight + this.layout.spacing) + this.layout.spacing;
      this.widgets.questionImg = hmUI.createWidget(hmUI.widget.IMG, {
        x: (DEVICE_WIDTH - px(64)) / 2,
        y: questionY,
        w: px(64),
        h: px(104),
        src: 'icons/question_64bw.png'
      });

      this.widgets.questionImg.addEventListener(hmUI.event.CLICK_DOWN, () => {
        this.state.selectedIndex = questionIndex;
        updateSelection();
      });

      this.widgets.questionImg.addEventListener(hmUI.event.MOVE, () => {
        this.state.selectedIndex = -1;
        updateSelection();
      });

      this.widgets.questionImg.addEventListener(hmUI.event.CLICK_UP, () => {
        if (this.state.selectedIndex === questionIndex) {
          this.state.selectedIndex = -1;
          updateSelection();
          this.executeAction(this.state.helpItem);
        }
      });

      // 4. Логика физических кнопок
      onKey({
        callback: (key, keyEvent) => {
          if (keyEvent !== KEY_EVENT_CLICK) return false;

          // ВАЖНО: Увеличили общее количество элементов на 1
          const totalElements = this.state.menuItems.length + 1;

          if (key === KEY_DOWN) {
            this.state.selectedIndex = this.state.selectedIndex === -1 ? 0 : (this.state.selectedIndex + 1) % totalElements;
            updateSelection();
            scrollToItem(this.state.selectedIndex);
            return true;
          }
          else if (key === KEY_UP) {
            this.state.selectedIndex = this.state.selectedIndex <= 0 ? (totalElements - 1) : (this.state.selectedIndex - 1);
            updateSelection();
            scrollToItem(this.state.selectedIndex);
            return true;
          }
          else if (key === KEY_SELECT) {
            if (this.state.selectedIndex !== -1) {
              let item = this.state.helpItem;
              if (this.state.selectedIndex < questionIndex) {
                item = this.state.menuItems[this.state.selectedIndex];
              }
              this.state.selectedIndex = -1;
              updateSelection();
              this.executeAction(item);
            }
            return true;
          }

          return false;
        }
      });
    },

    createLayout() {
      const startX = px(40);            // Центрирование (40 пикселей от каждого края)      
      const startY = px(130);           // Отступ сверху (под заголовком)
      const buttonHeight = px(126);      // Высота одной плашки
      const spacing = px(25);           // Расстояние между плашками
      const buttonWidth = DEVICE_WIDTH - (2 * startX); // Ширина плашки (экран минус отступы по бокам)

      return {
        startX,
        startY,
        buttonHeight,
        spacing,
        buttonWidth
      };
    },


    buildTitle() {
      this.widgets.title = hmUI.createWidget(hmUI.widget.TEXT, {
        ...TITLE(this.layout, i18n("app_name") || "Daily Mandala"),
      });
    },

    // 5. Выделяем логику активации пункта в отдельный метод
    executeAction(item) {
      logger.log(`Активирован пункт: ${item.title}`);

      
      if (item.id === 'collection' && !AppStorage.getRecord(STORAGE_KEYS.LINKED)) {
        push({ url: 'page/nolink' });
      } else {
        let url = `page/${item.id}`;
        const pushOptions = { url };
        if (item.params) {
          pushOptions.params = item.params;
        }
        push(pushOptions);
      }
    },

    updateStatusText(message) {
      if (!this.widgets.text) {
        this.widgets.text = hmUI.createWidget(hmUI.widget.TEXT, {
          ...FETCH_RESULT_TEXT,
          text: message,
        });
      } else {
        this.widgets.text.setProperty(hmUI.prop.TEXT, message);
      }
    },

    loadNews() {
      const lastNews = AppStorage.getRecord(STORAGE_KEYS.LAST_NEWS) || 0;
      const nowTime = Date.now() / 1000;
      console.log(`loadNews lastNews: ${lastNews}, nowTime: ${nowTime}`);

      if (lastNews + 10 * 24 * 60 * 60 < nowTime) {
        const request = Profile.createRequestData();
        request.time = lastNews;

        this.request({
          method: "GET_NEWS",
          request
        })
          .then((data) => {
            const { result = {}, news = [] } = data;
            if (result === "Ok" && news.length > 0) {
              let content = ""
              news.forEach(item => {
                content += item.body + '\n\n';
              });
              const item = news[0];
              logger.log(`News: ${item.date}, ${item.title}, ${content}`);

              const alarmId =
                scheduleNotification({
                  title: item.title,
                  content: content,
                  // vibrate: 1,
                  //   actions: [
                  //     {
                  //       text: i18n("open"),
                  //       file: "page/index",
                  //     },
                  //   ],
                });
              console.log(`Notification scheduled, alarmId=${alarmId}`);
              /*
                            const safeTitle = item.title ? String(item.title) : "Новое событие";
                            const safeContent = "Тестовый текст"; // Оставляем жесткую строку для теста
                            //Сделать страницу Последнее уведомление на которую будет переход с уведомления.
                            //На странице показать тот же текст?
                            //лучше через alarm вывести уведомление на следующие сутки примерно в это же время, если не позднее, или до 9pm
              
                            const notifyId = notificationMgr.notify({
                              title: item.title,
                              content: item.body,
                              vibrate: 1,
                              actions: [
                                {
                                  text: "Открыть",
                                  file: "page/index",
                                },
                              ],
                            });
              
                            if (notifyId > 0) {
                              logger.log(`Уведомление успешно отправлено! ID: ${notifyId}`);
                            } else {
                              logger.log("Ошибка: системе не удалось отправить уведомление.");
                            }
                            // });
              */
              AppStorage.setRecord(STORAGE_KEYS.LAST_NEWS, nowTime);
            } else {
              logger.log("Phone returned error:", data);
            }
          })
          .catch((err) => {
            logger.log("Network/BLE error:", err);
          });
      }
    },

    onDestroy() {
      offKey();
    }
  })
);