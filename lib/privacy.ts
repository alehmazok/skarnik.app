// Privacy policy of the Skarnik mobile apps (Android and iOS) and of this site.
// Every statement here is checked against the apps' code (skarnik_android,
// skarnik_ios) and this repo. Change it when what the apps collect changes,
// and bump `updated`.

export type PolicyLang = 'be' | 'en'

export interface PolicyLink {
  text: string
  href: string
}

/** A run of text: plain strings and links. */
export type Rich = string | (string | PolicyLink)[]

export type PolicyBlock = { p: Rich } | { ul: Rich[] }

export interface PolicySection {
  id: string
  heading: string
  blocks: PolicyBlock[]
}

export interface PrivacyPolicy {
  lang: PolicyLang
  title: string
  description: string
  updatedLabel: string
  /** ISO date, shown with `updatedLabel`. */
  updated: string
  updatedText: string
  otherLanguage: PolicyLink
  sections: PolicySection[]
}

export const PRIVACY_CONTACT_EMAIL = 'skarnikapp@gmail.com'
export const PRIVACY_UPDATED = '2026-11-07'

const mail: PolicyLink = { text: PRIVACY_CONTACT_EMAIL, href: `mailto:${PRIVACY_CONTACT_EMAIL}` }

const links = {
  firebase: 'https://firebase.google.com/support/privacy',
  googlePrivacy: 'https://policies.google.com/privacy',
  sentry: 'https://sentry.io/privacy/',
  supabase: 'https://supabase.com/privacy',
  posthog: 'https://posthog.com/privacy',
}

const be: PrivacyPolicy = {
  lang: 'be',
  title: 'Палітыка прыватнасці',
  description: 'Якія даныя збіраюць праграмы Скарнік для Android і iOS і сайт skarnik.app, і навошта.',
  updatedLabel: 'Абноўлена',
  updated: PRIVACY_UPDATED,
  updatedText: '7 лістапада 2026',
  otherLanguage: { text: 'English', href: '/privacy/en' },
  sections: [
    {
      id: 'short',
      heading: 'Коратка',
      blocks: [
        { p: 'Гэтая палітыка тычыцца праграмы Скарнік для Android і iOS (Google Play, App Store, AppGallery) і сайта skarnik.app.' },
        {
          ul: [
            'У Скарніку няма ўліковых запісаў, рэгістрацыі, рэкламы і пакупак.',
            'Гісторыя пошуку, закладкі, спампаваныя слоўнікі і налады захоўваюцца толькі на вашай прыладзе.',
            'Ананімная статыстыка выкарыстання адпраўляецца толькі калі вы на гэта пагадзіліся. Згоду можна адклікаць у наладах.',
            'Справаздачы пра збоі праграмы дапамагаюць выпраўляць памылкі і не ўтрымліваюць вашых асабістых даных.',
            'Мы не прадаём даныя і не перадаём іх для рэкламы.',
          ],
        },
      ],
    },
    {
      id: 'device',
      heading: 'Што застаецца на прыладзе',
      blocks: [
        {
          ul: [
            'Гісторыя пошуку (словы, якія вы адкрывалі) і закладкі.',
            'Слоўнікі, спампаваныя для працы без інтэрнэту.',
            'Налады: тэма, колеры, адказ на пытанне пра статыстыку, лічыльнік для запыту адзнакі.',
            'Віджэт «Слова дня» на Android помніць словы, якія ўжо паказваў, каб не паўтараць іх 30 дзён.',
          ],
        },
        { p: 'Гэтыя даныя нікуды не адпраўляюцца. Гісторыю можна ачысціць у наладах, закладкі выдаляюцца ў спісе закладак, спампаваныя слоўнікі выдаляюцца ў наладах. Усё астатняе знікае, калі выдаліць праграму.' },
      ],
    },
    {
      id: 'content',
      heading: 'Запыты перакладаў',
      blocks: [
        { p: 'Калі слоўнік спампаваны, праграма бярэ пераклад з прылады і нічога не адпраўляе. Інакш яна запытвае слова па чарзе:' },
        {
          ul: [
            ['базу слоўніка ў ', { text: 'Supabase', href: links.supabase }, ' (адтуль жа спампоўваюцца слоўнікі);'],
            'сервер Скарніка (skarnik.play.of.by), калі слова не знайшлося ў Supabase.',
          ],
        },
        { p: 'Калі вы адкрываеце націск слова, праграма запытвае яго на starnik.by, а калі там няма, на серверы Скарніка. Віджэт «Слова дня» бярэ выпадковае слова з тых жа крыніц.' },
        { p: 'Такі запыт утрымлівае толькі слова або яго нумар у слоўніку. Як і любы вэб-сервер, гэтыя серверы бачаць IP-адрас прылады і могуць часова захоўваць яго ў тэхнічных журналах. Мы не звязваем гэтыя запыты з вамі.' },
        { p: 'Каб пераклады адкрываліся хутчэй, праграма захоўвае на прыладзе кэш адказаў сервераў (на Android 24 гадзіны па змоўчанні).' },
      ],
    },
    {
      id: 'analytics',
      heading: 'Статыстыка выкарыстання (Firebase Analytics)',
      blocks: [
        { p: ['Пры першым запуску праграма пытаецца, ці можна збіраць ананімную статыстыку. Пакуль вы не адказалі «так», статыстыка не адпраўляецца. Адказ можна змяніць у наладах («Аналітыка выкарыстання»). Статыстыку збірае ', { text: 'Google Firebase Analytics', href: links.firebase }, '.'] },
        { p: 'Калі вы пагадзіліся, адпраўляюцца падзеі: запуск праграмы, пошук (тэкст запыту, колькасць вынікаў і выбраны вынік), адкрыты пераклад (слова, слоўнік і адкуль ён узяты), слова, адкрытае ў спісе слоўніка, «Падзяліцца», націск, спампоўка слоўніка, на Android даданне ў закладкі, на iOS адкрыццё слова з віджэта і пераход на starnik.by або drukarnik.app. Firebase дадае да іх версію праграмы, мадэль прылады, версію сістэмы, мову, прыблізны рэгіён (па IP-адрасе, сам адрас не захоўваецца) і выпадковы ідэнтыфікатар усталявання праграмы, а на iOS яшчэ ідэнтыфікатар для распрацоўшчыка (IDFV), які Apple дае кожнай праграме асобна.' },
        { p: 'Мы не збіраем рэкламны ідэнтыфікатар і не просім дазволу на адсочванне, не збіраем імя, электронную пошту, кантакты ці месцазнаходжанне. На Android выключаны аўтаматычны ўлік экранаў. Статыстыка патрэбна, каб разумець, якія словы шукаюць і чаго не хапае ў слоўніку. Firebase захоўвае падзеі не даўжэй за 14 месяцаў.' },
      ],
    },
    {
      id: 'crashes',
      heading: 'Справаздачы пра збоі',
      blocks: [
        { p: ['Калі праграма падае, завісае або сутыкаецца з унутранай памылкай, яна адпраўляе справаздачу ў ', { text: 'Sentry', href: links.sentry }, ' (і на Android, і на iOS): тып памылкі і стэк выклікаў, версію праграмы, мадэль прылады і версію сістэмы. Гэта патрэбна, каб знаходзіць і выпраўляць памылкі, таму справаздачы адпраўляюцца незалежна ад згоды на статыстыку.'] },
        { p: 'Справаздачы не ўтрымліваюць IP-адраса, ідэнтыфікатара карыстальніка, здымкаў экрана, тэксту пошуку, слоў ці адрасоў запытаў. Праграма не адпраўляе ў Sentry звестак пра хуткадзейнасць і запісаў сеансаў. Справаздачы захоўваюцца да 90 дзён.' },
      ],
    },
    {
      id: 'config',
      heading: 'Аддаленыя налады (толькі Android)',
      blocks: [
        { p: ['Пры запуску праграма Android запытвае ў ', { text: 'Firebase Remote Config', href: links.firebase }, ' тэхнічныя налады, напрыклад, колькі часу захоўваць кэш перакладаў. Разам з запытам адпраўляецца выпадковы ідэнтыфікатар усталявання Firebase. Ніякіх падзей і даных пра выкарыстанне ў гэтым запыце няма.'] },
      ],
    },
    {
      id: 'other',
      heading: 'Іншае',
      blocks: [
        {
          ul: [
            'Адзнака праграмы. Пасля некалькіх перакладаў праграма адзін раз прапануе адзначыць яе праз Google Play або App Store. Гэта акно паказвае сама крама, і мы не бачым, ці адзначылі вы праграму.',
            'Ліст распрацоўшчыку. Кнопка адкрывае вашу паштовую праграму з гатовым лістом. На Android у ім ужо ёсць версія праграмы, мадэль прылады і версія сістэмы, а ў паведамленні пра памылку ў слове на iOS — слова, спасылка на яго і тып памылкі. Вы бачыце ліст перад адпраўкай і можаце яго змяніць. Мы выкарыстоўваем ліст і ваш адрас толькі каб адказаць.',
            'Спасылкі на іншыя сайты (starnik.by, drukarnik.app, крамы праграм) адкрываюцца ў браўзеры, і на іх дзейнічаюць правілы гэтых сайтаў.',
            'Праграма не просіць доступу да кантактаў, камеры, мікрафона, фота ці месцазнаходжання.',
          ],
        },
      ],
    },
    {
      id: 'website',
      heading: 'Сайт skarnik.app',
      blocks: [
        { p: ['Сайт выкарыстоўвае ', { text: 'PostHog', href: links.posthog }, ' (серверы ў ЕС) для статыстыкі наведванняў толькі калі вы націснулі «Прыняць» у паведамленні пра cookies. Улічваюцца прагляды старонак і слоў, націскі на кнопкі крам, змена тэмы і памылкі на старонцы. Выбар тэмы захоўваецца ў вашым браўзеры.'] },
      ],
    },
    {
      id: 'sharing',
      heading: 'Каму перадаюцца даныя',
      blocks: [
        { p: ['Даныя, апісаныя вышэй, апрацоўваюць толькі сэрвісы, якія працуюць на нас: Google (Firebase, ', { text: 'палітыка Google', href: links.googlePrivacy }, '), Sentry, Supabase і PostHog. Іх серверы могуць знаходзіцца па-за вашай краінай, у тым ліку ў ЗША. Мы не прадаём даныя і не выкарыстоўваем іх для рэкламы. Мы раскрыем даныя дзяржаўным органам толькі калі гэтага патрабуе закон.'] },
      ],
    },
    {
      id: 'rights',
      heading: 'Вашы правы',
      blocks: [
        { p: 'Вы можаце ў любы момант выключыць статыстыку ў наладах праграмы або адмовіцца ад cookies на сайце. Выдаленне праграмы выдаляе ўсе яе даныя з прылады, а пры новым усталяванні ствараецца новы выпадковы ідэнтыфікатар.' },
        { p: ['Мы не ведаем, хто вы, таму не можам самі знайсці вашы даныя ў статыстыцы. Калі вы хочаце даведацца пра свае даныя, выдаліць іх або паскардзіцца, напішыце нам на ', mail, ', і мы дапаможам. Вы таксама можаце звярнуцца ў орган па ахове даных у вашай краіне.'] },
      ],
    },
    {
      id: 'children',
      heading: 'Дзеці',
      blocks: [
        { p: 'Скарнікам можна карыстацца ў любым узросце. Праграма не просіць ніякіх асабістых даных і не паказвае рэкламы. Мы свядома не збіраем асабістых даных дзяцей.' },
      ],
    },
    {
      id: 'changes',
      heading: 'Змены і кантакты',
      blocks: [
        { p: 'Калі праграмы пачнуць збіраць іншыя даныя, мы абновім гэтую старонку і дату ўверсе.' },
        { p: ['Пытанні пра прыватнасць: ', mail, '.'] },
      ],
    },
  ],
}

const en: PrivacyPolicy = {
  lang: 'en',
  title: 'Privacy policy',
  description: 'What the Skarnik apps for Android and iOS and the skarnik.app website collect, and why.',
  updatedLabel: 'Last updated',
  updated: PRIVACY_UPDATED,
  updatedText: 'November 7, 2026',
  otherLanguage: { text: 'Беларуская', href: '/privacy' },
  sections: [
    {
      id: 'short',
      heading: 'In short',
      blocks: [
        { p: 'This policy covers the Skarnik app for Android and iOS (Google Play, App Store, AppGallery) and the skarnik.app website.' },
        {
          ul: [
            'Skarnik has no accounts, sign-up, ads or purchases.',
            'Search history, bookmarks, downloaded dictionaries and settings stay on your device.',
            'Anonymous usage statistics are sent only if you agree. You can withdraw consent in Settings.',
            'Crash reports help us fix bugs and contain no personal data.',
            'We do not sell data or share it for advertising.',
          ],
        },
      ],
    },
    {
      id: 'device',
      heading: 'What stays on your device',
      blocks: [
        {
          ul: [
            'Search history (words you opened) and bookmarks.',
            'Dictionaries downloaded for offline use.',
            'Settings: theme, colours, your answer about statistics, a counter for the rating prompt.',
            'On Android, the Word of the Day widget remembers the words it showed so it does not repeat them for 30 days.',
          ],
        },
        { p: 'None of this is sent anywhere. You can clear history in Settings, remove bookmarks from the bookmarks list and delete downloaded dictionaries in Settings. Everything else is removed when you uninstall the app.' },
      ],
    },
    {
      id: 'content',
      heading: 'Translation requests',
      blocks: [
        { p: 'If a dictionary is downloaded, the app takes the translation from the device and sends nothing. Otherwise it asks for the word in this order:' },
        {
          ul: [
            ['the dictionary database on ', { text: 'Supabase', href: links.supabase }, ' (dictionaries are downloaded from there too);'],
            'the Skarnik server (skarnik.play.of.by), if the word is not found on Supabase.',
          ],
        },
        { p: 'When you open a word’s stress, the app asks starnik.by, and the Skarnik server if starnik.by has no match. The Word of the Day widget takes a random word from the same sources.' },
        { p: 'Such a request contains only the word or its number in the dictionary. Like any web server, these servers see your device’s IP address and may keep it briefly in technical logs. We do not link these requests to you.' },
        { p: 'To open translations faster, the app keeps a cache of server responses on the device (24 hours by default on Android).' },
      ],
    },
    {
      id: 'analytics',
      heading: 'Usage statistics (Firebase Analytics)',
      blocks: [
        { p: ['On first launch the app asks whether it may collect anonymous statistics. Nothing is sent until you answer “yes”. You can change your answer in Settings (“Usage analytics”). Statistics are collected by ', { text: 'Google Firebase Analytics', href: links.firebase }, '.'] },
        { p: 'If you agree, the app sends events: app opened, search (query text, number of results and the result you picked), translation opened (word, dictionary and where it came from), word opened from the dictionary list, share, stress, dictionary download, on Android adding a bookmark, on iOS a word opened from the widget and opening starnik.by or drukarnik.app. Firebase adds the app version, device model, OS version, language, approximate region (derived from the IP address, which is not stored) and a random app-instance identifier, and on iOS also the identifier for vendor (IDFV), which Apple gives each developer’s apps separately.' },
        { p: 'We do not collect the advertising identifier or ask for tracking permission, and do not collect your name, email, contacts or location. Automatic screen tracking is off on Android. We use the statistics to understand which words people look for and what the dictionary is missing. Firebase keeps events for no longer than 14 months.' },
      ],
    },
    {
      id: 'crashes',
      heading: 'Crash reports',
      blocks: [
        { p: ['When the app crashes, hangs or hits an internal error, it sends a report to ', { text: 'Sentry', href: links.sentry }, ' (on both Android and iOS): the error type and stack trace, app version, device model and OS version. We need this to find and fix bugs, so reports are sent regardless of the statistics consent.'] },
        { p: 'Reports contain no IP address, user identifier, screenshots, search text, words or request addresses. The app sends no performance data or session recordings to Sentry. Reports are kept for up to 90 days.' },
      ],
    },
    {
      id: 'config',
      heading: 'Remote configuration (Android only)',
      blocks: [
        { p: ['At start the Android app fetches technical settings from ', { text: 'Firebase Remote Config', href: links.firebase }, ', for example how long to cache translations. The request carries a random Firebase installation identifier. It contains no events or usage data.'] },
      ],
    },
    {
      id: 'other',
      heading: 'Other',
      blocks: [
        {
          ul: [
            'Rating. After several translations the app asks once to rate it through Google Play or the App Store. The store shows that dialog, and we cannot see whether you rated the app.',
            'Email to the developer. The button opens your mail app with a prepared email. On Android it includes the app version, device model and OS version; an iOS report about a word includes the word, its link and the kind of mistake. You see the email before sending and can edit it. We use the email and your address only to reply.',
            'Links to other sites (starnik.by, drukarnik.app, app stores) open in your browser, and those sites’ own policies apply.',
            'The app does not ask for access to contacts, camera, microphone, photos or location.',
          ],
        },
      ],
    },
    {
      id: 'website',
      heading: 'The skarnik.app website',
      blocks: [
        { p: ['The website uses ', { text: 'PostHog', href: links.posthog }, ' (servers in the EU) for visit statistics only after you click “Accept” in the cookie notice. It records page and word views, store-button clicks, theme changes and page errors. Your theme choice is stored in your browser.'] },
      ],
    },
    {
      id: 'sharing',
      heading: 'Who receives data',
      blocks: [
        { p: ['The data described above is processed only by services working for us: Google (Firebase, ', { text: 'Google’s privacy policy', href: links.googlePrivacy }, '), Sentry, Supabase and PostHog. Their servers may be outside your country, including in the USA. We do not sell data or use it for advertising. We disclose data to authorities only when the law requires it.'] },
      ],
    },
    {
      id: 'rights',
      heading: 'Your rights',
      blocks: [
        { p: 'You can turn statistics off at any time in the app’s Settings, or decline cookies on the website. Uninstalling the app removes all its data from the device, and a new install gets a new random identifier.' },
        { p: ['We do not know who you are, so we cannot look up your data in the statistics ourselves. To ask about, delete or complain about your data, write to ', mail, ' and we will help. You can also contact the data protection authority in your country.'] },
      ],
    },
    {
      id: 'children',
      heading: 'Children',
      blocks: [
        { p: 'Skarnik is suitable for all ages. The app asks for no personal data and shows no ads. We do not knowingly collect personal data from children.' },
      ],
    },
    {
      id: 'changes',
      heading: 'Changes and contact',
      blocks: [
        { p: 'If the apps start collecting other data, we will update this page and the date at the top.' },
        { p: ['Privacy questions: ', mail, '.'] },
      ],
    },
  ],
}

export const privacyPolicies: Record<PolicyLang, PrivacyPolicy> = { be, en }
