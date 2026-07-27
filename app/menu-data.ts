export type MenuLine = {
  name: string;
  price?: string;
  details?: string[];
  description?: string;
};

export type MenuSubsection = {
  title: string;
  images: string[];
  items: MenuLine[];
  sideLabel?: string;
  sidePrice?: string;
};

export type MenuCategory = {
  id: string;
  title: string;
  navLabel: string;
  icon: string;
  fromPrice: string;
  images: string[];
  items: MenuLine[];
  sideLabel?: string;
  sidePrice?: string;
  note?: string;
  subsections?: MenuSubsection[];
};

export type Promotion = {
  id: string;
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  variant: "weekday" | "one-plus-one";
};

const imageRange = (folder: string, count: number) =>
  Array.from({ length: count }, (_, index) =>
    `/assets/banners/${folder}/${index + 1}.webp`,
  );

export const settings = {
  promoIntervalMs: 6500,
  bannerIntervalMs: 6500,
  tipsUrl: "https://netmonet.co/qr/865087/groups/0?o=0",
  reviewUrl: "https://yandex.ru/maps/org/my_loft/237870493212/reviews/?ll=43.988352%2C56.311162&tab=reviews&utm_campaign=v1&utm_medium=qr_image&utm_source=qr&z=15",
  contentEndpoint: "",
  contentCacheKey: "my-loft-menu-content-v1",
};

export const promotions: Promotion[] = [
  {
    id: "weekday-hookah",
    image: "/assets/promos/promo-1.webp",
    alt: "По будням с 12:00 до 18:00 кальян 1000 рублей",
    eyebrow: "По будням с 12:00–18:00",
    title: "КАЛЬЯН 1000 ₽",
    variant: "weekday",
  },
  {
    id: "hookah-one-plus-one",
    image: "/assets/promos/promo-2.webp",
    alt: "Кальян один плюс один за 2300 рублей",
    eyebrow: "Кальян 1+1",
    title: "2300 ₽",
    variant: "one-plus-one",
  },
];

export const categories: MenuCategory[] = [
  {
    id: "hookah",
    title: "Кальян",
    navLabel: "Кальян",
    icon: "/assets/icons/hookah.webp",
    fromPrice: "от 1000 ₽",
    images: imageRange("hookah", 1),
    items: [
      { name: "Бизнес 12:00 - 18:00", price: "1000 ₽" },
      { name: "Стандарт", price: "1500 ₽" },
      { name: "Стандарт 1 + 1 *", price: "2300 ₽" },
    ],
    note: "* При условии единовременного заказа",
  },
  {
    id: "drinks",
    title: "Напитки",
    navLabel: "Напитки",
    icon: "/assets/icons/drinks.webp",
    fromPrice: "от 150 ₽",
    images: imageRange("drinks", 5),
    items: [
      { name: "Вода газированная", price: "150 ₽" },
      { name: "Газировка в ассортименте", price: "250 ₽" },
      { name: "Энергетик", price: "300 ₽" },
      { name: "Соки", price: "250 ₽" },
      { name: "Пиво в ассортименте", price: "470 ₽" },
    ],
    subsections: [
      {
        title: "Домашние лимонады",
        images: imageRange("lemonades", 5),
        items: [
          {
            name: "Ежевика – фиалка",
            description:
              "Яркий ягодный лимонад с тонкими цветочными нотами фиалки. Освежающий вкус с лёгкой кислинкой лайма и нежным ароматом.",
          },
          {
            name: "Черника – мята – лимон",
            description:
              "Сочная черника в сочетании со свежей мятой создаёт насыщенный и освежающий вкус. Лимон добавляет лёгкую цитрусовую свежесть и помогает напитку идеально утолять жажду.",
          },
          {
            name: "Киви – яблоко",
            description:
              "Экзотический киви и сочное зелёное яблоко с лёгкой лаймовой кислинкой. Свежий, фруктовый и очень летний лимонад.",
          },
          {
            name: "Ягодный морс",
            description:
              "Микс лесных ягод и клюквенного морса с малиновыми нотами и приятной цитрусовой свежестью. Богатый ягодный вкус без приторности.",
          },
          {
            name: "Малина – эстрагон",
            description:
              "Необычное сочетание сладкой малины и пряного эстрагона. Освежающий лимонад с лёгкой кислинкой лайма и ярким послевкусием.",
          },
        ],
        sideLabel: "450 мл",
        sidePrice: "290 ₽",
      },
    ],
  },
  {
    id: "tea",
    title: "Чай",
    navLabel: "Чай",
    icon: "/assets/icons/tea.webp",
    fromPrice: "от 420 ₽",
    images: imageRange("tea", 5),
    sideLabel: "750 мл",
    sidePrice: "420 ₽",
    items: [
      { name: "Сенча" },
      { name: "Габа" },
      { name: "Гречишный" },
      { name: "Жасмин" },
      { name: "Молочный улун" },
      { name: "Чабрец" },
      { name: "Таежный" },
      { name: "Саша едет в Голливуд" },
      { name: "Эрл Грей" },
    ],
    subsections: [
      {
        title: "Домашний чай",
        images: imageRange("home-tea", 5),
        items: [
          {
            name: "Яблоко – киви",
            description:
              "Освежающий зелёный чай на основе сенчи с нежным пюре из киви и яблока. Во вкусе — лёгкая терпкость и фруктовая сладость, в послевкусии — едва уловимая кислинка и травянистая свежесть. Идеально, если хочется мягкого, ненавязчивого напитка.",
          },
          {
            name: "Грейпфрут – можжевельник",
            description:
              "Многослойный чёрный чай с Эрл Греем, горчинкой грейпфрута, хвойной свежестью можжевельника и ягодной кислинкой смородины. Ромовый сироп добавляет карамельную глубину. Для любителей крепких, терпких напитков с характером.",
          },
          {
            name: "Крыжовник – апельсин",
            description:
              "Пряный чёрный чай на основе ассама с согревающим имбирным сиропом. Крыжовник даёт яркую терпкость, апельсин — цитрусовую кислинку, а послевкусие долго держит имбирное тепло. Для тех, кто любит бодрые, пряные чаи.",
          },
        ],
        sideLabel: "750 мл",
        sidePrice: "550 ₽",
      },
      {
        title: "Китайский чай",
        images: imageRange("tea", 5),
        items: [
          { name: "Медовая Габа" },
          { name: "Да Хун Пао" },
          { name: "Шу Пуэр" },
          { name: "Те Гуань Инь" },
        ],
        sideLabel: "750 мл",
        sidePrice: "420 ₽",
      },
    ],
  },
  {
    id: "coffee",
    title: "Кофе",
    navLabel: "Кофе",
    icon: "/assets/icons/coffee.webp",
    fromPrice: "от 200 ₽",
    images: imageRange("coffee", 4),
    items: [
      { name: "Американо", price: "200 ₽" },
      { name: "Эспрессо", price: "200 ₽" },
      { name: "Капучино", price: "250 ₽" },
      { name: "Латте", price: "250 ₽" },
    ],
  },
  {
    id: "hot",
    title: "Горячее",
    navLabel: "Горячее",
    icon: "/assets/icons/hot.webp",
    fromPrice: "от 390 ₽",
    images: imageRange("hot", 4),
    items: [
      { name: "Сэндвич LITE", price: "390 ₽" },
      { name: "Сэндвич BIG", price: "450 ₽" },
      {
        name: "Завтраки",
        price: "650 ₽",
        details: ["Большой", "Мексиканский"],
      },
      {
        name: "Комбо с картошкой",
        price: "550 ₽",
        details: ["С баварскими колбасками", "С крыльями", "Сэндвич LITE", "Панини"],
      },
      {
        name: "Панини",
        price: "500 ₽",
        details: ["С говядиной", "С курицей", "Диабло"],
      },
      { name: "Допы", price: "75 ₽", details: ["Халапеньо", "Глазунья"] },
    ],
  },
];
