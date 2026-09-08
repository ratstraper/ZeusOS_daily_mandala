import { getText as i18n } from "@zos/i18n"

/**
 * 
 * @param {"A {0} b {1} c {2} d"} msgid 
 * @param  {...any} args 
 * @returns string
 * @usage t('id', "Lee", 10000, 30)
 */
export function t(msgid, ...args) {
  let text = i18n(msgid)
  if (!text) return msgid 

  args.forEach((arg, index) => {
    // new RegExp с флагом 'g' заменит все вхождения, даже если {0} используется дважды
    text = text.replace(new RegExp(`\\{${index}\\}`, 'g'), String(arg))
  })

  return text
}

/**
 * "{name} {steps}, {name}!"
 * t('msgid', { name: "Lee", steps: 10000 })
 */
// export function t(msgid, params = {}) {
//   let text = getText(msgid)

//   if (!text) return msgid

//   // Перебираем ключи переданного объекта
//   for (const [key, value] of Object.entries(params)) {
//     text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value))
//   }

//   return text
// }