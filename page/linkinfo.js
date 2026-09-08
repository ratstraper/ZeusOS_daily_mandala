import {
  createWidget,
  widget,
  align,
  text_style,
  getTextLayout,
} from "@zos/ui";
import { getText as i18n } from "@zos/i18n";
import { log as Logger, px } from "@zos/utils";
import { Vibrator } from "@zos/sensor";
import { push } from "@zos/router";
import { BasePage } from "@zeppos/zml/base-page";
import AppStorage from "../utils/config/storage.js";
import { width } from "../utils/config/device.js";

const logger = Logger.getLogger("mandala_day");

const vibrator = new Vibrator();

/**
 * Справка "почему коллекция недоступна и как связать часы с кошельком".
 * В отличие от page/help (горизонтальный свайпер) — одна вертикально
 * прокручиваемая страница: заголовок, текст, кнопка [Детали на сайте].
 * Прокрутка — штатный SCROLL_MODE_FREE, ничего включать не нужно:
 * страница скроллится, потому что виджеты выходят за высоту экрана.
 */

const UI = {
  padX: px(28),
  topY: px(42),

  titleSize: px(32),
  textSize: px(24),

  dividerW: px(60),
  dividerH: px(2),

  gapAfterTitle: px(20),
  gapAfterDivider: px(24),
  gapBeforeButton: px(32),

  btnH: px(72),
  btnRadius: px(36),

  // запас снизу, чтобы кнопку не срезал круглый экран при прокрутке до конца
  bottomPad: px(90),
};

function measureText(text, size, textWidth) {
  return getTextLayout(text, {
    text_size: size,
    text_width: textWidth,
    wrapped: 1,
  });
}

function hapticStrong() {
  vibrator.stop();
  vibrator.start(25);
  setTimeout(() => vibrator.stop(), 180);
}

Page(
  BasePage({
    build() {
      logger.log(`LINKINFO.JS`);
      const contentW = width - UI.padX * 2;
      let y = UI.topY;

      const title = i18n("no_link_help_title");
      const text = i18n("no_link_help_text");

      const titleLayout = measureText(title, UI.titleSize, contentW);
      createWidget(widget.TEXT, {
        x: UI.padX,
        y,
        w: contentW,
        h: titleLayout.height,
        color: 0xffffff,
        text_size: UI.titleSize,
        text_style: text_style.WRAP,
        align_h: align.CENTER_H,
        align_v: align.TOP,
        text: title,
      });
      y += titleLayout.height + UI.gapAfterTitle;

      createWidget(widget.FILL_RECT, {
        x: (width - UI.dividerW) / 2,
        y,
        w: UI.dividerW,
        h: UI.dividerH,
        color: 0x333333,
        radius: px(1),
      });
      y += UI.dividerH + UI.gapAfterDivider;

      const textLayout = measureText(text, UI.textSize, contentW);
      createWidget(widget.TEXT, {
        x: UI.padX,
        y,
        w: contentW,
        h: textLayout.height,
        color: 0xc7c7c7,
        text_size: UI.textSize,
        text_style: text_style.WRAP,
        align_h: align.CENTER_H,
        align_v: align.TOP,
        text,
      });
      y += textLayout.height + UI.gapBeforeButton;

      createWidget(widget.BUTTON, {
        x: UI.padX,
        y,
        w: contentW,
        h: UI.btnH,
        radius: UI.btnRadius,
        normal_color: 0x1f8ed6,
        press_color: 0x156fa8,
        text: i18n("no_link_help_action"),
        text_size: px(24),
        color: 0xffffff,
        click_func: () => {
          hapticStrong();
          const url = AppStorage.getLinkUrl();
          logger.log("open link QR from help:", url);
          push({
            url: "page/link",
            params: JSON.stringify({ url }),
          });
        },
      });
      y += UI.btnH;

      createWidget(widget.FILL_RECT, {
        x: 0,
        y,
        w: width,
        h: UI.bottomPad,
        color: 0x000000,
      });
    },

    onDestroy() {
      vibrator.stop();
    },
  })
);