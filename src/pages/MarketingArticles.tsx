import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

type Article = {
  id: string;
  title: string;
  summary: string;
  paragraphs: string[];
  links: { label: string; href: string }[];
};

const articlesHe: Article[] = [
  {
    id: 'article-1',
    title: 'למה כל כך קשה לנהל כמה פלטפורמות פרסום במקביל',
    summary:
      'בעלי עסקים ומנהלי שיווק מרגישים שהם טובעים בין Google Ads, Meta, TikTok ומערכות אנליטיקה שונות. כל מערכת מציגה מספרים אחרים, שפה אחרת והיגיון עבודה שונה.',
    paragraphs: [
      'כאשר הקמפיינים מפוזרים בין כמה פלטפורמות, מתקבלת תמונה חלקית ולא עסקית. בכל ממשק יש KPI אחר, חלון זמן אחר ודרך שונה למדוד הצלחה. במצב כזה קל מאוד לקבל החלטות מתוך לחץ במקום מתוך נתונים אמיתיים.',
      'הבעיה מחמירה כאשר צריך גם לעקוב אחרי מכירות מהחנות, לבדוק עלויות רכישה, לעדכן קהלים ולשמור על עקביות בקריאייטיב. במקום להתמקד בצמיחה, רוב הזמן הולך על מעבר בין מסכים וניסיון להבין מי צודק.',
      'הפתרון המעשי הוא לרכז את המידע העסקי במקום אחד. כשיש דאשבורד מרכזי שמציג נתוני קמפיינים, SEO ומכירות, אפשר לזהות במהירות מה עובד, מה צריך לעצור ואיפה כדאי להשקיע כבר היום.',
    ],
    links: [
      { label: 'לקריאה על ניהול חכם של קידום דיגיטלי', href: '#article-2' },
      { label: 'לקריאה על AI שמבין אלגוריתמים', href: '#article-3' },
      { label: 'לקריאה על קריאייטיב ואוטומציות', href: '#article-4' },
      { label: 'עמוד חיבורים ואינטגרציות', href: '/connections' },
      { label: 'מדריך הפעלה מלא למערכת', href: '/guide' },
    ],
  },
  {
    id: 'article-2',
    title: 'הצורך בניהול חכם של קידום דיגיטלי, וכל העסק בכף ידך',
    summary:
      'ניהול דיגיטלי חכם אומר לראות את כל העסק בתמונה אחת: פרסום, תנועה, SEO, מכירות ורווחיות. כאשר הנתונים יושבים יחד, ההחלטות הופכות למהירות ומדויקות.',
    paragraphs: [
      'עסק צומח חייב שליטה בזמן אמת. מנהל שיווק צריך לדעת לא רק כמה הוציא, אלא כמה נכנס, איזה קמפיין באמת רווחי, ואילו פעולות ישפרו תוצאות כבר השבוע. זה לא עוד דוח, זו מערכת קבלת החלטות.',
      'כשכל המדדים מרוכזים במסך אחד אפשר לעבוד חכם יותר: לתעדף קמפיינים, להקטין בזבוז תקציב, להגדיל חשיפה לערוצים מנצחים ולוודא שכל שקל משרת מטרה עסקית ברורה.',
      'היתרון הגדול הוא תחושת שליטה. במקום לרדוף אחרי דאטא, הדאטה מגיע אליך. כך כל העסק נמצא ממש בכף היד שלך, עם יכולת פעולה מיידית ולא רק מעקב פסיבי.',
    ],
    links: [
      { label: 'לקריאה על הקושי במעבר בין פלטפורמות', href: '#article-1' },
      { label: 'לקריאה על היתרון של כלי AI מודרני', href: '#article-3' },
      { label: 'לקריאה על קריאייטיב חכם ואוטומציות', href: '#article-4' },
      { label: 'עמוד סקירה כללית', href: '/app' },
      { label: 'עמוד רווחיות ודוחות כספיים', href: '/profitability' },
    ],
  },
  {
    id: 'article-3',
    title: 'היתרון בכלי AI מודרני שמבין אלגוריתמים ומוביל קידום מנצח',
    summary:
      'AI מודרני יודע לנתח נפחי נתונים, לזהות דפוסים ולהציע פעולות עם עדיפות עסקית. הוא לא מחליף את מנהל השיווק, אלא נותן לו יתרון מהירות ודיוק.',
    paragraphs: [
      'בעולם פרסום תחרותי, אלגוריתמים משתנים כל הזמן. מה שעבד החודש לא תמיד יעבוד בחודש הבא. כלי AI טוב מנתח ביצועים היסטוריים, משווה ערוצים ומזהה איפה הסיכוי הגבוה לשיפור תשואה.',
      'כאשר עובדים נכון עם AI מתקבלת שותפות אמיתית: המערכת מציעה כיווני פעולה, והצוות העסקי מגדיר אסטרטגיה, סדרי עדיפויות ומיתוג. כך מקבלים גם דיוק טכני וגם שליטה אנושית מלאה.',
      'התוצאה היא קידום מנצח ללא פשרות: פחות ניחושים, יותר החלטות מבוססות נתונים, ושיפור רציף בביצועים לאורך זמן.',
    ],
    links: [
      { label: 'לקריאה על כאב ריבוי הממשקים', href: '#article-1' },
      { label: 'לקריאה על ניהול חכם בכף היד', href: '#article-2' },
      { label: 'לקריאה על קריאייטיב חכם ואוטומציות', href: '#article-4' },
      { label: 'עמוד המלצות AI', href: '/ai-recommendations' },
      { label: 'עמוד ניתוח חיפושים', href: '/search-analysis' },
    ],
  },
  {
    id: 'article-4',
    title: 'יצירת קריאייטיב חכמה ומדויקת עם אוטומציות ואופטימיזציה מיטבית',
    summary:
      'קריאייטיב טוב הוא מנוע צמיחה, אבל כדי לשמור על ביצועים צריך גם תהליך עבודה חכם. כאן נכנסים אוטומציות, בדיקות ורצף אופטימיזציה.',
    paragraphs: [
      'יצירת מודעות צריכה להיות מבוססת נתונים ולא תחושת בטן. כשמחברים בין נתוני מוצרים, קהלים וביצועים קודמים, אפשר לייצר קריאייטיב שמתאים לקהל הנכון ברגע הנכון.',
      'אוטומציות חכמות חוסכות זמן ומקטינות טעויות אנוש. הן מאפשרות להריץ בדיקות וריאציות, לעדכן תקציבים לפי תוצאות ולשפר מודעות חלשות לפני שהן שורפות תקציב.',
      'השילוב בין קריאייטיב חכם, אופטימיזציה שוטפת ותובנות AI יוצר מערכת פרסום בריאה יותר. כך העסק מתקדם בצורה יציבה, מדויקת ורווחית.',
    ],
    links: [
      { label: 'לקריאה על אתגר ניהול כמה פלטפורמות', href: '#article-1' },
      { label: 'לקריאה על ניהול חכם של קידום דיגיטלי', href: '#article-2' },
      { label: 'לקריאה על AI שמבין אלגוריתמים', href: '#article-3' },
      { label: 'עמוד מעבדת יצירה', href: '/creative-lab' },
      { label: 'עמוד אוטומציות', href: '/automations' },
    ],
  },
];

const titleByLang: Record<string, string> = {
  he: '4 מאמרים מקצועיים על שיווק דיגיטלי חכם',
  en: '4 Professional Articles on Smart Digital Marketing',
  ru: '4 профессиональные статьи по умному digital маркетингу',
  pt: '4 artigos profissionais sobre marketing digital inteligente',
  fr: '4 articles professionnels sur le marketing digital intelligent',
};

const subtitleByLang: Record<string, string> = {
  he: 'מאמרי עומק עם קישורים פנימיים בין נושאים מרכזיים באתר.',
  en: 'In depth articles with internal links between key site topics.',
  ru: 'Подробные статьи с внутренними ссылками между ключевыми темами сайта.',
  pt: 'Artigos aprofundados com links internos entre os principais temas do site.',
  fr: 'Articles approfondis avec des liens internes entre les principaux sujets du site.',
};

const tocTitleByLang: Record<string, string> = {
  he: 'תוכן עניינים',
  en: 'Table of contents',
  ru: 'Оглавление',
  pt: 'Sumário',
  fr: 'Sommaire',
};

const relatedLinksTitleByLang: Record<string, string> = {
  he: 'קישורים פנימיים מומלצים',
  en: 'Recommended internal links',
  ru: 'Рекомендуемые внутренние ссылки',
  pt: 'Links internos recomendados',
  fr: 'Liens internes recommandés',
};

const backHomeByLang: Record<string, string> = {
  he: 'חזרה לדף הבית',
  en: 'Back to home',
  ru: 'Назад на главную',
  pt: 'Voltar para a página inicial',
  fr: "Retour à l'accueil",
};

export function MarketingArticles() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex justify-center px-4 py-10">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-10 space-y-8">
        <header className="space-y-3 text-center">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
            {titleByLang[language] ?? titleByLang.he}
          </h1>
          <p className="text-sm text-gray-500">{subtitleByLang[language] ?? subtitleByLang.he}</p>
        </header>

        <section className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
          <h2 className="text-base font-bold text-gray-900 mb-3">
            {tocTitleByLang[language] ?? tocTitleByLang.he}
          </h2>
          <ol className="list-decimal list-inside text-sm space-y-1">
            {articlesHe.map((article) => (
              <li key={article.id}>
                <a href={`#${article.id}`} className="text-indigo-600 hover:underline">
                  {article.title}
                </a>
              </li>
            ))}
          </ol>
        </section>

        {articlesHe.map((article, index) => (
          <article
            id={article.id}
            key={article.id}
            className="space-y-4 border border-gray-200 rounded-2xl p-5 sm:p-7"
          >
            <header className="space-y-2">
              <p className="text-xs font-bold text-indigo-600">מאמר {index + 1}</p>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{article.title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{article.summary}</p>
            </header>

            <div className="space-y-3 text-sm leading-relaxed text-gray-800">
              {article.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex}>{paragraph}</p>
              ))}
            </div>

            <div className="pt-2">
              <h3 className="text-sm font-bold text-gray-900 mb-2">
                {relatedLinksTitleByLang[language] ?? relatedLinksTitleByLang.he}
              </h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                {article.links.map((link) => (
                  <li key={`${article.id}-${link.href}`}>
                    <a href={link.href} className="text-indigo-600 hover:underline">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}

        <footer className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
          <a href="/" className="text-indigo-600 hover:underline">
            {backHomeByLang[language] ?? backHomeByLang.he}
          </a>
          <span>BScale AI © {new Date().getFullYear()}</span>
        </footer>
      </div>
    </div>
  );
}

