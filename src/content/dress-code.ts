import {dressPalettes} from "./dress-palettes.mjs";
import {dressMaterials} from "./dress-materials.mjs";
export type LookExample={id:string;status:string;image:string|null;title:string;description:string;eyebrow?:string};
export const dressCode={
  "helpBefore": "Если сомневаетесь в образе или не уверены, подходит ли выбранный оттенок, обязательно",
  "helpLink": "напишите Ане",
  "helpAfter": ". Она подскажет.",
  "helpUrl": "https://t.me/Selesssta",
  "title": "Дресс-код",
  "intro": "Две основные гаммы и много оттенков. Выбирай образ, в котором чувствуешь себя собой.",
  "previous": "Предыдущий пример",
  "next": "Следующий пример",
  "galleryLabel": "Примеры дресс-кода",
  "allowedTitle": "Так можно",
  "avoidTitle": "Лучше выбрать другой вариант",
  "paletteTitle": "Наша палитра",
  "materialsTitle": "Материалы",
  "jacketEmphasis": "должен",
  "blackWarning": "Черный мы не используем, даже на носках. Мы их увидим.",
  "placeholder": "Фотографию добавим позже",
  "paletteHint": "Не обязательно попадать оттенок в оттенок. Выбирайте близкие тёплые и спокойные тона.",
  "familyHint": "Можно использовать близкие оттенки",
  "categories": [
    {
      "id": "women",
      "label": "Для девушек",
      "pages": [
        {
          "id": "women-clothes",
          "label": "Одежда",
          "paletteFamilies": [
            {
              "id": "olive",
              "name": "Оливковая гамма",
              "description": "От светлого тёплого шалфейного до тёмного оливкового",
              "shades": dressPalettes.olive
            },
            {
              "id": "butter",
              "name": "Сливочное масло → золото",
              "description": "Заметно жёлто-сливочный, вплоть до тёплого золота",
              "shades": dressPalettes.creamGold
            }
          ],
          "explanation": "Фасон почти свободный. Пышный, прямой, короткий, до середины икры, облегающий или асимметричный. Выбирайте тёплый приглушённый оливковый или оттенки от сливочного масла до золота. Даже самые светлые должны быть заметно жёлто-сливочными, а не почти белыми.",
          "materialGroups": dressMaterials["women-clothes"],
          "materials": "Подойдут шелк, атлас и фатин. Можно выбирать и другие похожие ткани. Главное, чтобы материал выглядел празднично, а цвет попадал в нашу гамму.",
          "rules": [],
          "allowed": [
            {
              "image": "/images/dress-lookbook-v5/deep-olive-slip.webp",
              "title": "Тёмный тёплый оливковый",
              "description": "Тёмный оливковый подходит, пока остаётся тёплым и приглушённым. Гладкий шёлк и облегающий силуэт тоже подходят.",
              "id": "deep-olive-slip",
              "status": "allowed",
              "eyebrow": "Настоятельно рекомендуем"
            },
            {
              "image": "/images/dress-lookbook-v6/butter-column.webp",
              "title": "Светлое сливочное масло",
              "description": "Глянцевый атлас красиво отражает свет и образует мягкие складки. Жёлто-сливочный оттенок, прямой длинный силуэт и лаконичный лиф подходят к нашей гамме.",
              "id": "butter-column",
              "status": "allowed",
              "eyebrow": "Настоятельно рекомендуем"
            },
            {
              "image": "/images/dress-lookbook-v6/sage-ballgown.webp",
              "title": "Светлый оливковый с драпировкой",
              "description": "Светлый тёплый оливковый, лиф на одно плечо и мягкая драпировка. Лёгкий полупрозрачный слой и вытянутый силуэт делают платье нарядным без бального объёма.",
              "id": "sage-ballgown",
              "status": "allowed"
            },
            {
              "image": "/images/dress-lookbook-v6/warm-gold-asymmetric.webp",
              "title": "Золотистое сияние",
              "description": "Светлое тёплое золото с мягким атласным блеском. Длинное платье на одно плечо и плавная драпировка выглядят празднично, без горчичного и коричневого подтона.",
              "id": "warm-gold-asymmetric",
              "status": "allowed"
            },
            {
              "image": "/images/dress-lookbook-v6/eucalyptus-embroidered.webp",
              "title": "Оливковый с воздушным бантом",
              "description": "Тёплый оливковый, драпированный лиф и бант на плече с длинными лентами. Лёгкая органза, струящаяся юбка и мягкий волан создают вечерний силуэт.",
              "id": "eucalyptus-embroidered",
              "status": "allowed"
            },
            {
              "image": "/images/dress-lookbook-v6/olive-short.webp",
              "title": "Сливочный шёлк",
              "description": "Мягкий жёлто-сливочный оттенок остаётся заметно теплее белого. Длинное шёлковое платье на тонких бретелях с мягкой драпировкой у горловины подходит по цвету и настроению.",
              "id": "olive-short",
              "status": "allowed"
            }
          ],
          "avoid": [
            {
              "image": "/images/dress-lookbook-v5/mint-tulle.webp",
              "title": "Слишком холодная мята",
              "description": "Фасон и воздушный фатин подходят, но оттенок получается слишком холодным и мятным. Нам нужен более тёплый оливковый тон.",
              "id": "mint-tulle",
              "status": "avoid"
            },
            {
              "image": "/images/dress-lookbook-v5/emerald-fitted.webp",
              "title": "Холодный глубокий изумруд",
              "description": "Само вечернее платье подходит по настроению. Но изумруд слишком тёмный, насыщенный и холодный для тёплой оливковой гаммы.",
              "id": "emerald-fitted",
              "status": "avoid"
            },
            {
              "image": "/images/dress-lookbook-v6/chartreuse-midi.webp",
              "title": "Принт и обильная вышивка",
              "description": "Крупные цветы, заметная вышивка и обилие декора перегружают образ. Вместо активного рисунка выбирайте однотонную ткань в нашей гамме.",
              "id": "chartreuse-midi",
              "status": "avoid"
            },
            {
              "image": "/images/dress-lookbook-v6/ivory-short.webp",
              "title": "Слишком короткая почти белая шампань",
              "description": "Здесь не подходят сразу почти белый оттенок, слишком короткая длина и пышный корсетный фасон. Выберите более спокойный силуэт и заметно жёлто-сливочный цвет.",
              "id": "ivory-short",
              "status": "avoid"
            },
            {
              "image": "/images/dress-lookbook-v5/silver-champagne.webp",
              "title": "Холодная серебристая шампань",
              "description": "К вечернему силуэту вопросов нет. Оттенку не хватает тёплого сливочно-золотистого подтона, он уходит в холодное серебро.",
              "id": "silver-champagne",
              "status": "avoid"
            }
          ]
        },
        {
          "id": "women-accessories",
          "label": "Аксессуары",
          "paletteFamilies": [
            {
              "id": "milk",
              "name": "Если основа оливковая",
              "description": "Светлые тёплые и оливковые аксессуары",
              "shades": dressPalettes.oliveBase
            },
            {
              "id": "gold",
              "name": "Если основа сливочно-золотая",
              "description": "Светлые кремовые и мягкие золотистые аксессуары",
              "shades": dressPalettes.creamGoldBase
            }
          ],
          "explanation": "Обувь не обязана повторять цвет одежды. К оливковой основе подойдут светлые тёплые и оливковые аксессуары. К сливочно-золотой выбирайте молочные, кремовые и мягкие золотистые оттенки.",
          "materialGroups": dressMaterials["women-accessories"],
          "materials": "Для сумок, перчаток и обуви подойдут кожа, органза и бархат. В украшениях ориентируйтесь на жемчуг, золото и бижутерию в нашей цветовой гамме.",
          "rules": [],
          "allowed": [
            {
              "image": "/images/dress-lookbook-v5/women-accessories-ivory.webp",
              "title": "Светлая обувь",
              "description": "Сумка и туфли заметно кремовые. Такой тёплый оттенок сочетается с оливковым платьем.",
              "id": "women-accessories-ivory",
              "status": "allowed"
            },
            {
              "image": "/images/dress-lookbook-v5/women-accessories-pearl.webp",
              "title": "Жемчуг и светлая сумка",
              "description": "Кремовый жемчуг и тёплая основа сумки добавляют мягкий блеск. Подойдут к обеим нашим гаммам.",
              "id": "women-accessories-pearl",
              "status": "allowed"
            },
            {
              "image": "/images/dress-lookbook-v6/women-accessories-gold.webp",
              "title": "Золотые босоножки",
              "description": "Изящные золотистые босоножки, вечерняя сумочка и тёплые золотые украшения с жемчугом. Этот комплект добавляет праздничный блеск и остаётся в нашей золотистой гамме.",
              "id": "women-accessories-gold",
              "status": "allowed"
            },
            {
              "image": "/images/dress-lookbook-v6/women-accessories-cream.webp",
              "title": "Оливковые аксессуары",
              "description": "Приглушённые оливковые босоножки и сумка поддерживают нашу палитру. Бархатная лента и небольшие золотые украшения добавляют мягкую фактуру и блеск.",
              "id": "women-accessories-cream",
              "status": "allowed"
            }
          ],
          "avoid": [
            {
              "image": "/images/dress-lookbook-v5/women-accessories-neon.webp",
              "title": "Кислотные акценты",
              "description": "Неоновые детали слишком сильно перетягивают внимание. Лучше взять светлую обувь и спокойную сумку.",
              "id": "women-accessories-neon",
              "status": "avoid"
            },
            {
              "image": "/images/dress-lookbook-v5/women-accessories-black.webp",
              "title": "Тяжёлый чёрный акцент",
              "description": "Крупная чёрная сумка и тяжёлая тёмная обувь слишком контрастные. Лучше выбрать светлые аксессуары.",
              "id": "women-accessories-black",
              "status": "avoid"
            },
            {
              "image": "/images/dress-lookbook-v5/women-accessories-silver.webp",
              "title": "Ледяной металлик",
              "description": "Зеркальное серебро слишком холодное. Лучше выбрать жемчуг или тёплое золото.",
              "id": "women-accessories-silver",
              "status": "avoid"
            }
          ]
        }
      ]
    },
    {
      "id": "men",
      "label": "Для мужчин",
      "pages": [
        {
          "id": "men-clothes",
          "label": "Одежда",
          "paletteFamilies": [
            {
              "id": "olive",
              "name": "Оливковая гамма",
              "description": "От светлого шалфейного до тёмного оливкового",
              "shades": dressPalettes.olive
            },
            {
              "id": "milk",
              "name": "Молочная гамма",
              "description": "Молочные и кремовые оттенки, без белого",
              "shades": dressPalettes.milk
            }
          ],
          "explanation": "Основной цвет пиджака должен быть в оливковой гамме. Рубашка молочная, не белая. Галстук или бабочка тоже оливковые. Для брюк и обуви подойдут близкие оливковые и светлые тёплые оттенки.",
          "materialGroups": dressMaterials["men-clothes"],
          "materials": "Подойдут лен, вискоза, вельвет и хлопок. Материал может быть плотным или более легким. Главное, чтобы одежда оставалась в оливковой и молочной гамме.",
          "rules": [
            {
              "title": "Пиджак",
              "text": "Подойдут оливковый, эвкалиптовый, мшистый, приглушённый хаки и тёплый шалфейный. Без яркого чистого зелёного."
            },
            {
              "title": "Рубашка",
              "text": "Рубашка молочная, не белая. Подойдут айвори и кремовый, без золотистого отлива."
            },
            {
              "title": "Галстук или бабочка",
              "text": "В оливковой гамме, близко к пиджаку или немного светлее либо темнее."
            },
            {
              "title": "Брюки",
              "text": "Подойдут оливковые и близкие оттенки, молочный, айвори, кремовый или тёплый светлый беж."
            }
          ],
          "allowed": [
            {
              "image": "/images/dress-lookbook-v5/men-clothes-milk.webp",
              "title": "Оливковый и молочный",
              "description": "Оливковый пиджак и галстук сочетаются с молочными брюками и кремовой рубашкой. Светлая обувь поддерживает тёплую гамму.",
              "id": "men-clothes-milk",
              "status": "allowed"
            },
            {
              "image": "/images/dress-lookbook-v5/men-clothes-moss.webp",
              "title": "Мох и тёплый коричневый",
              "description": "Приглушённый оливковый пиджак и бабочка сочетаются с молочными брюками. Кремовая рубашка и коричневая обувь связывают образ.",
              "id": "men-clothes-moss",
              "status": "allowed"
            },
            {
              "image": "/images/dress-lookbook-v5/men-clothes-sage.webp",
              "title": "Разные оливковые",
              "description": "Мягкий шалфейный костюм и кремовая рубашка остаются в нашей оливковой гамме. Обувь выбрана в тон образу.",
              "id": "men-clothes-sage",
              "status": "allowed"
            },
            {
              "image": "/images/dress-lookbook-v5/men-clothes-neutral.webp",
              "title": "Светлые нейтральные брюки",
              "description": "Тёмный оливковый пиджак и молочные брюки можно сочетать. Кремовая рубашка, бабочка и коричневая обувь делают переход мягче.",
              "id": "men-clothes-neutral",
              "status": "allowed"
            }
          ],
          "avoid": [
            {
              "image": "/images/dress-lookbook-v5/men-clothes-neon.webp",
              "title": "Слишком яркая зелень",
              "description": "Кислотный зелёный не входит в приглушённую гамму. Выбирайте более мягкий оливковый пиджак.",
              "id": "men-clothes-neon",
              "status": "avoid"
            },
            {
              "image": "/images/dress-lookbook-v5/men-clothes-blue.webp",
              "title": "Синий вместо оливкового",
              "description": "Синий костюм сам по себе хорош, но здесь не подходит по цвету. Выбирайте оливковый пиджак.",
              "id": "men-clothes-blue",
              "status": "avoid"
            },
            {
              "image": "/images/dress-lookbook-v5/men-clothes-sport.webp",
              "title": "Повседневные фактуры",
              "description": "Поло и кроссовки создают спортивное настроение. Пиджак, рубашка и оливковый галстук сделают образ праздничным.",
              "id": "men-clothes-sport",
              "status": "avoid"
            }
          ]
        },
        {
          "id": "men-accessories",
          "label": "Аксессуары",
          "paletteFamilies": [
            {
              "id": "brown",
              "name": "Обувь и ремень",
              "description": "Молочный, беж и тёплый коричневый",
              "shades": [
                {
                  "name": "Молочный",
                  "color": "#EEE5D4"
                },
                {
                  "name": "Беж",
                  "color": "#DACCBA"
                },
                {
                  "name": "Песочный",
                  "color": "#B7A183"
                },
                {
                  "name": "Коньячный",
                  "color": "#96734F"
                },
                {
                  "name": "Коричневый",
                  "color": "#72583F"
                }
              ]
            },
            {
              "id": "olive",
              "name": "Оливковая гамма",
              "description": "Приглушённые шалфей, эвкалипт и мох",
              "shades": [
                {
                  "name": "Светлый шалфей",
                  "color": "#909B7D"
                },
                {
                  "name": "Эвкалиптовый",
                  "color": "#859077"
                },
                {
                  "name": "Оливковый",
                  "color": "#788064"
                },
                {
                  "name": "Хаки",
                  "color": "#6F785B"
                },
                {
                  "name": "Мшистый",
                  "color": "#626B4F"
                }
              ]
            }
          ],
          "explanation": "Оливковые галстуки и бабочки, молочные или кремовые платки. Для обуви и ремня подойдут светлый беж, тёплый коричневый и спокойные нейтральные оттенки, при необходимости близкие оливковые.",
          "materialGroups": dressMaterials["men-accessories"],
          "materials": "Для обуви и ремней подойдут кожа и замша. Галстук, бабочку, платок и цветок выбирайте в оливковой или молочной гамме.",
          "rules": [],
          "allowed": [
            {
              "image": "/images/dress-lookbook-v6/men-accessories-tie.webp",
              "title": "Оливковый галстук",
              "description": "Однотонный оливковый шёлковый галстук, кремовый платок и светлая кожаная обувь. Тёплые оттенки и мягкий блеск подходят к праздничному образу.",
              "id": "men-accessories-tie",
              "status": "allowed"
            },
            {
              "image": "/images/dress-lookbook-v5/men-accessories-bow.webp",
              "title": "Бабочка и светлый беж",
              "description": "Оливковая бабочка, кремовый платок и бежевая обувь сочетаются без резких контрастов. Ремень поддерживает тёплый оттенок обуви.",
              "id": "men-accessories-bow",
              "status": "allowed"
            },
            {
              "image": "/images/dress-lookbook-v6/men-accessories-brown.webp",
              "title": "Тёплый коричневый",
              "description": "Обувь и ремень в одной тёплой коричневой гамме. Такой комплект хорошо сочетается с оливковым костюмом.",
              "id": "men-accessories-brown",
              "status": "allowed"
            },
            {
              "image": "/images/dress-lookbook-v6/men-accessories-olive.webp",
              "title": "Спокойные оливковые детали",
              "description": "Приглушённые оливковые аксессуары поддерживают молочный образ. Ремень остаётся оливковым, без почти чёрного оттенка.",
              "id": "men-accessories-olive",
              "status": "allowed"
            }
          ],
          "avoid": [
            {
              "image": "/images/dress-lookbook-v6/men-accessories-neon.webp",
              "title": "Кислотные и яркие акценты",
              "description": "Ярко-розовый галстук, кислотные детали и контрастная синяя обувь слишком сильно перетягивают внимание. Лучше выбрать спокойные оливковые и тёплые нейтральные аксессуары.",
              "id": "men-accessories-neon",
              "status": "avoid"
            },
            {
              "image": "/images/dress-lookbook-v6/men-accessories-print.webp",
              "title": "Активные принты",
              "description": "Пёстрые галстук, бабочка, платок и небольшая сумка спорят друг с другом. Крупные контрастные рисунки лучше заменить однотонными аксессуарами в нашей гамме.",
              "id": "men-accessories-print",
              "status": "avoid"
            },
            {
              "image": "/images/dress-lookbook-v6/men-accessories-sport.webp",
              "title": "Слишком спортивные аксессуары",
              "description": "Массивные кроссовки, спортивная сумка, кепка и часы делают комплект слишком повседневным. Для свадьбы лучше выбрать аккуратную обувь и более сдержанные детали.",
              "id": "men-accessories-sport",
              "status": "avoid"
            },
            {
              "id": "men-accessories-clown",
              "status": "avoid",
              "image": "/images/dress-lookbook-v5/men-accessories-clown.webp",
              "title": "Клоунский набор",
              "description": "Мы уже продумали программу. Выступление клоуна в нее не входит."
            }
          ]
        }
      ]
    }
  ],
  "notice": "Дорогие гости, мы не обязуем вас покупать то же самое, что и на картинках. Это всё примеры. Вы можете выбрать одежду и аксессуары, которые вам больше нравятся. Основное правило в том, чтобы цвет одежды и аксессуаров совпадал с нашей цветовой гаммой.",
  "viewer": {
    "open": "Рассмотреть образ",
    "close": "Закрыть просмотр",
    "previous": "Предыдущий образ",
    "next": "Следующий образ"
  },
  "floating": {
    "label": "Быстрое управление дресс-кодом",
    "gendersLabel": "Кому выбираем образ",
    "pagesLabel": "Одежда или аксессуары",
    "genders": [
      "Женщины",
      "Мужчины"
    ]
  }
};
