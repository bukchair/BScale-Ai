import React, { useEffect, useMemo, useState } from 'react';
import { Bot, MessageCircle, Send, Sparkles, X, MessageSquareText } from 'lucide-react';
import { useLanguage, type Language } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';
import { createPublicSalesLead } from '../lib/firebase';
import { translations } from '../i18n/translations';

type ChatMessage = {
  id: string;
  from: 'bot' | 'user';
  text: string;
};

type QuickIntent = 'pricing' | 'demo' | 'integrations' | 'roi' | 'lead';

type SiteSnippet = {
  title: string;
  content: string;
};

interface LeadFormState {
  name: string;
  email: string;
  phone: string;
  website: string;
}

const MAX_SNIPPET_LENGTH = 260;

type SalesBotCopy = {
  botTitle: string;
  greeting: string;
  leadCta: string;
  quickPricing: string;
  quickDemo: string;
  quickIntegrations: string;
  quickRoi: string;
  quickLead: string;
  askPlaceholder: string;
  askButton: string;
  leaveNow: string;
  fullName: string;
  email: string;
  phone: string;
  websiteOptional: string;
  sendDetails: string;
  saving: string;
  later: string;
  quickLogin: string;
  aiAssistant: string;
  openAria: string;
  submitErrorContact: string;
  saveLeadError: string;
  leadPrompt: string;
  leadSaved: string;
  sitePrefix: string;
  siteContentPrefix: string;
  noMatch: string;
  pricingFallback: string;
  integrationsTitle: string;
  integrationsGoogle: string;
  integrationsMeta: string;
  integrationsTikTok: string;
  integrationsWoo: string;
  websiteHeading: string;
  websiteContent: string;
  syntheticPricing: string;
  syntheticDemo: string;
  syntheticIntegrations: string;
  syntheticRoi: string;
};

const SALES_BOT_COPY: Record<Language, SalesBotCopy> = {
  en: {
    botTitle: 'BScale Sales Bot',
    greeting: 'Hi! I am the BScale sales bot. Ask me anything about the platform and I answer using website content.',
    leadCta: 'To get a tailored plan and exact pricing, leave your details here and we will contact you quickly.',
    quickPricing: 'Pricing & plans',
    quickDemo: 'Book a demo',
    quickIntegrations: 'Supported integrations',
    quickRoi: 'How does it improve ROI?',
    quickLead: 'Leave details',
    askPlaceholder: 'Ask any free-form question...',
    askButton: 'Ask',
    leaveNow: 'Leave details now',
    fullName: 'Full name',
    email: 'Email',
    phone: 'Phone',
    websiteOptional: 'Website / store (optional)',
    sendDetails: 'Send details',
    saving: 'Saving...',
    later: 'Later',
    quickLogin: 'Quick login to platform',
    aiAssistant: 'AI Sales Assistant',
    openAria: 'Open sales bot',
    submitErrorContact: 'Please provide a name + email or phone.',
    saveLeadError: 'Could not save your details right now. Please try again in a moment.',
    leadPrompt: 'Great. Leave your name + email or phone and I will route a tailored plan to you.',
    leadSaved: 'Great! Your details were saved and the system administrator received an in-app alert.',
    sitePrefix: 'Based on website information',
    siteContentPrefix: 'Based on website content',
    noMatch: 'I could not find an exact match in the currently visible site content, but I can send a tailored answer once I know your business needs.',
    pricingFallback: 'Choose the plan that fits your business. Start with a demo site; full access after subscribing.',
    integrationsTitle: 'Integrations',
    integrationsGoogle: 'Google Ads, Analytics 4, Search Console and Gmail reporting.',
    integrationsMeta: 'Meta Ads and Pixel management with audience sync.',
    integrationsTikTok: 'TikTok Ads campaigns and trend tracking.',
    integrationsWoo: 'WooCommerce products, inventory and orders sync.',
    websiteHeading: 'Website heading',
    websiteContent: 'Website content',
    syntheticPricing: 'What are the pricing plans?',
    syntheticDemo: 'How can I book a demo?',
    syntheticIntegrations: 'What integrations are supported?',
    syntheticRoi: 'How does the platform improve ROI?',
  },
  he: {
    botTitle: 'בוט מכירות BScale',
    greeting: 'היי! אני בוט המכירות של BScale. אפשר לשאול אותי כל שאלה על המערכת, ואני עונה לפי המידע שמופיע באתר.',
    leadCta: 'כדי לקבל תכנית מותאמת והצעת מחיר מדויקת — השאר/י פרטים כאן ונחזור אליך מהר.',
    quickPricing: 'מחירים וחבילות',
    quickDemo: 'לקבוע דמו',
    quickIntegrations: 'חיבורים נתמכים',
    quickRoi: 'איך זה משפר ROI?',
    quickLead: 'השארת פרטים',
    askPlaceholder: 'שאל/י כל שאלה חופשית...',
    askButton: 'שאל',
    leaveNow: 'להשארת פרטים עכשיו',
    fullName: 'שם מלא',
    email: 'אימייל',
    phone: 'טלפון',
    websiteOptional: 'אתר / חנות (אופציונלי)',
    sendDetails: 'שליחת פרטים',
    saving: 'שומר פרטים...',
    later: 'אחר כך',
    quickLogin: 'כניסה מהירה למערכת',
    aiAssistant: 'AI Sales Assistant',
    openAria: 'פתח בוט מכירות',
    submitErrorContact: 'נא למלא שם + אימייל או טלפון.',
    saveLeadError: 'לא הצלחנו לשמור את הפרטים כרגע. נסה שוב בעוד רגע.',
    leadPrompt: 'מעולה. מלא/י שם + אימייל או טלפון ואני אדאג שיחזרו אליך עם תכנית מדויקת.',
    leadSaved: 'מעולה! הפרטים נשמרו במערכת ומנהל המערכת קיבל התראה באפליקציה.',
    sitePrefix: 'לפי המידע באתר',
    siteContentPrefix: 'לפי תוכן האתר',
    noMatch: 'לא מצאתי תשובה מדויקת בתוכן הגלוי כרגע, אבל אשמח לשלוח לך תשובה מותאמת אישית אחרי שנכיר את העסק.',
    pricingFallback: 'בחר את התוכנית שמתאימה לעסק שלך. מתחילים עם אתר דמו; גישה מלאה לאחר רכישת מנוי.',
    integrationsTitle: 'אינטגרציות',
    integrationsGoogle: 'Google Ads, Analytics 4, Search Console ו-Gmail לדוחות.',
    integrationsMeta: 'ניהול Meta Ads ופיקסל כולל סנכרון קהלים.',
    integrationsTikTok: 'ניהול קמפיינים ב-TikTok ומעקב מגמות.',
    integrationsWoo: 'סנכרון מוצרים, מלאי והזמנות מ-WooCommerce.',
    websiteHeading: 'כותרת באתר',
    websiteContent: 'תוכן באתר',
    syntheticPricing: 'מה המחירים?',
    syntheticDemo: 'איך קובעים דמו?',
    syntheticIntegrations: 'אילו אינטגרציות יש?',
    syntheticRoi: 'איך המערכת משפרת רווחיות?',
  },
  ru: {
    botTitle: 'BScale Sales Bot',
    greeting: 'Привет! Я бот продаж BScale. Задайте любой вопрос о платформе — я отвечаю на основе контента сайта.',
    leadCta: 'Чтобы получить персональный план и точную цену, оставьте контакты — мы быстро свяжемся с вами.',
    quickPricing: 'Тарифы и цены',
    quickDemo: 'Записаться на демо',
    quickIntegrations: 'Поддерживаемые интеграции',
    quickRoi: 'Как это повышает ROI?',
    quickLead: 'Оставить контакты',
    askPlaceholder: 'Задайте любой вопрос...',
    askButton: 'Спросить',
    leaveNow: 'Оставить контакты сейчас',
    fullName: 'Полное имя',
    email: 'Email',
    phone: 'Телефон',
    websiteOptional: 'Сайт / магазин (необязательно)',
    sendDetails: 'Отправить контакты',
    saving: 'Сохраняем...',
    later: 'Позже',
    quickLogin: 'Быстрый вход в систему',
    aiAssistant: 'AI Sales Assistant',
    openAria: 'Открыть бот продаж',
    submitErrorContact: 'Укажите имя и email или телефон.',
    saveLeadError: 'Сейчас не удалось сохранить ваши данные. Пожалуйста, попробуйте еще раз через минуту.',
    leadPrompt: 'Отлично. Оставьте имя и email или телефон, и мы подготовим для вас персональный план.',
    leadSaved: 'Отлично! Ваши данные сохранены, и системный администратор получил уведомление в приложении.',
    sitePrefix: 'По информации с сайта',
    siteContentPrefix: 'На основе контента сайта',
    noMatch: 'Я не нашел точного совпадения в видимом контенте сайта, но могу отправить персональный ответ после знакомства с вашим бизнесом.',
    pricingFallback: 'Выберите тариф под ваш бизнес. Начните с демо-сайта; полный доступ после подписки.',
    integrationsTitle: 'Интеграции',
    integrationsGoogle: 'Google Ads, Analytics 4, Search Console и отчеты Gmail.',
    integrationsMeta: 'Meta Ads и Pixel с синхронизацией аудиторий.',
    integrationsTikTok: 'Кампании TikTok Ads и анализ трендов.',
    integrationsWoo: 'Синхронизация товаров, остатков и заказов WooCommerce.',
    websiteHeading: 'Заголовок сайта',
    websiteContent: 'Контент сайта',
    syntheticPricing: 'Какие у вас тарифы?',
    syntheticDemo: 'Как записаться на демо?',
    syntheticIntegrations: 'Какие интеграции поддерживаются?',
    syntheticRoi: 'Как платформа улучшает ROI?',
  },
  pt: {
    botTitle: 'BScale Sales Bot',
    greeting: 'Olá! Sou o bot de vendas da BScale. Faça qualquer pergunta sobre a plataforma e eu respondo com base no conteúdo do site.',
    leadCta: 'Para receber um plano personalizado e preço exato, deixe seus dados e entraremos em contato rapidamente.',
    quickPricing: 'Preços e planos',
    quickDemo: 'Agendar demo',
    quickIntegrations: 'Integrações suportadas',
    quickRoi: 'Como melhora o ROI?',
    quickLead: 'Deixar contato',
    askPlaceholder: 'Faça qualquer pergunta...',
    askButton: 'Perguntar',
    leaveNow: 'Deixar contato agora',
    fullName: 'Nome completo',
    email: 'Email',
    phone: 'Telefone',
    websiteOptional: 'Site / loja (opcional)',
    sendDetails: 'Enviar dados',
    saving: 'Salvando...',
    later: 'Depois',
    quickLogin: 'Login rápido na plataforma',
    aiAssistant: 'AI Sales Assistant',
    openAria: 'Abrir bot de vendas',
    submitErrorContact: 'Informe nome e email ou telefone.',
    saveLeadError: 'Não foi possível salvar seus dados agora. Tente novamente em instantes.',
    leadPrompt: 'Perfeito. Deixe seu nome + email ou telefone e eu encaminho um plano personalizado.',
    leadSaved: 'Perfeito! Seus dados foram salvos e o administrador do sistema recebeu um alerta no app.',
    sitePrefix: 'Com base nas informações do site',
    siteContentPrefix: 'Com base no conteúdo do site',
    noMatch: 'Não encontrei uma resposta exata no conteúdo visível do site agora, mas posso enviar uma resposta personalizada após entender seu negócio.',
    pricingFallback: 'Escolha o plano ideal para seu negócio. Comece com um site demo; acesso completo após a assinatura.',
    integrationsTitle: 'Integrações',
    integrationsGoogle: 'Google Ads, Analytics 4, Search Console e relatórios por Gmail.',
    integrationsMeta: 'Meta Ads e Pixel com sincronização de públicos.',
    integrationsTikTok: 'Campanhas TikTok Ads e análise de tendências.',
    integrationsWoo: 'Sincronização de produtos, estoque e pedidos WooCommerce.',
    websiteHeading: 'Título do site',
    websiteContent: 'Conteúdo do site',
    syntheticPricing: 'Quais são os planos e preços?',
    syntheticDemo: 'Como agendar uma demonstração?',
    syntheticIntegrations: 'Quais integrações são suportadas?',
    syntheticRoi: 'Como a plataforma melhora o ROI?',
  },
  fr: {
    botTitle: 'BScale Sales Bot',
    greeting: 'Bonjour ! Je suis le bot commercial BScale. Posez n’importe quelle question sur la plateforme et je réponds à partir du contenu du site.',
    leadCta: 'Pour obtenir un plan personnalisé et un prix précis, laissez vos coordonnées et nous vous contacterons rapidement.',
    quickPricing: 'Tarifs et offres',
    quickDemo: 'Réserver une démo',
    quickIntegrations: 'Intégrations prises en charge',
    quickRoi: 'Comment cela améliore le ROI ?',
    quickLead: 'Laisser mes coordonnées',
    askPlaceholder: 'Posez une question libre...',
    askButton: 'Demander',
    leaveNow: 'Laisser mes coordonnées maintenant',
    fullName: 'Nom complet',
    email: 'Email',
    phone: 'Téléphone',
    websiteOptional: 'Site / boutique (optionnel)',
    sendDetails: 'Envoyer les coordonnées',
    saving: 'Enregistrement...',
    later: 'Plus tard',
    quickLogin: 'Connexion rapide à la plateforme',
    aiAssistant: 'AI Sales Assistant',
    openAria: 'Ouvrir le bot commercial',
    submitErrorContact: 'Veuillez indiquer votre nom et un email ou un téléphone.',
    saveLeadError: 'Nous n’avons pas pu enregistrer vos coordonnées pour le moment. Veuillez réessayer dans un instant.',
    leadPrompt: 'Parfait. Laissez votre nom + email ou téléphone et je vous enverrai vers un plan adapté.',
    leadSaved: 'Parfait ! Vos informations sont enregistrées et l’administrateur système a reçu une alerte dans l’application.',
    sitePrefix: 'D’après les informations du site',
    siteContentPrefix: 'D’après le contenu du site',
    noMatch: 'Je n’ai pas trouvé de réponse exacte dans le contenu visible du site pour le moment, mais je peux vous envoyer une réponse personnalisée après avoir compris votre besoin.',
    pricingFallback: 'Choisissez le plan adapté à votre activité. Démarrez avec un site de démonstration ; accès complet après abonnement.',
    integrationsTitle: 'Intégrations',
    integrationsGoogle: 'Google Ads, Analytics 4, Search Console et rapports Gmail.',
    integrationsMeta: 'Meta Ads et Pixel avec synchronisation des audiences.',
    integrationsTikTok: 'Campagnes TikTok Ads et suivi des tendances.',
    integrationsWoo: 'Synchronisation des produits, stocks et commandes WooCommerce.',
    websiteHeading: 'Titre du site',
    websiteContent: 'Contenu du site',
    syntheticPricing: 'Quels sont les tarifs et plans ?',
    syntheticDemo: 'Comment réserver une démo ?',
    syntheticIntegrations: 'Quelles intégrations sont disponibles ?',
    syntheticRoi: 'Comment la plateforme améliore-t-elle le ROI ?',
  },
};

const getNestedTranslation = (lang: Language, key: string): string | undefined => {
  const keys = key.split('.');
  let value: any = translations[lang as keyof typeof translations];
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return undefined;
    }
  }
  return typeof value === 'string' ? value : undefined;
};

export function SalesBot() {
  const { language, dir } = useLanguage();
  const copy = SALES_BOT_COPY[language] ?? SALES_BOT_COPY.en;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [collectingLead, setCollectingLead] = useState(false);
  const [lead, setLead] = useState<LeadFormState>({ name: '', email: '', phone: '', website: '' });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [hasLeadSubmitted, setHasLeadSubmitted] = useState(false);
  const [domKnowledge, setDomKnowledge] = useState<SiteSnippet[]>([]);

  const tf = (key: string, fallback = '') => {
    return getNestedTranslation(language, key) ?? getNestedTranslation('en', key) ?? fallback;
  };

  const botGreeting = copy.greeting;
  const leadCta = copy.leadCta;

  const quickReplies = useMemo(() => [
    { id: 'pricing' as QuickIntent, label: copy.quickPricing },
    { id: 'demo' as QuickIntent, label: copy.quickDemo },
    { id: 'integrations' as QuickIntent, label: copy.quickIntegrations },
    { id: 'roi' as QuickIntent, label: copy.quickRoi },
    { id: 'lead' as QuickIntent, label: copy.quickLead },
  ], [copy]);

  const siteKnowledge = useMemo<SiteSnippet[]>(
    () => [
      {
        title: `${tf('landing.heroTitle1', 'BScale')} ${tf('landing.heroTitle2', 'AI')}`.trim(),
        content: tf('landing.heroSubtitle', copy.sitePrefix),
      },
      {
        title: tf('landing.featuresTitle', 'Features'),
        content: [
          tf('landing.f1_title'),
          tf('landing.f1_desc'),
          tf('landing.f2_title'),
          tf('landing.f2_desc'),
          tf('landing.f3_title'),
          tf('landing.f3_desc'),
          tf('landing.f4_title'),
          tf('landing.f4_desc'),
          tf('landing.f5_title'),
          tf('landing.f5_desc'),
          tf('landing.f6_title'),
          tf('landing.f6_desc'),
          tf('landing.f7_title'),
          tf('landing.f7_desc'),
          tf('landing.f8_title'),
          tf('landing.f8_desc'),
        ].join(' • '),
      },
      {
        title: tf('landing.pricingTitle', copy.quickPricing),
        content: `${tf('landing.pricingSubtitle', copy.pricingFallback)} ${tf('landing.plan1Name')} - ${tf('landing.plan1Desc')} ${tf('landing.plan2Name')} - ${tf('landing.plan2Desc')} ${tf('landing.plan3Name')} - ${tf('landing.plan3Desc')}`.trim(),
      },
      {
        title: copy.integrationsTitle,
        content: [
          tf('integrations.platforms.google.desc', copy.integrationsGoogle),
          tf('integrations.platforms.meta.desc', copy.integrationsMeta),
          tf('integrations.platforms.tiktok.desc', copy.integrationsTikTok),
          tf('integrations.platforms.woocommerce.desc', copy.integrationsWoo),
        ].join(' '),
      },
      {
        title: tf('profitability.title', copy.quickRoi),
        content: `${tf('profitability.subtitle')} ${tf('landing.f5_desc')}`,
      },
      {
        title: tf('landing.howItWorks', 'How it works'),
        content: `${tf('landing.s1_desc')} ${tf('landing.s2_desc')} ${tf('landing.s3_desc')}`,
      },
    ],
    [copy, language]
  );

  const knowledge = useMemo(() => [...siteKnowledge, ...domKnowledge], [siteKnowledge, domKnowledge]);

  useEffect(() => {
    setMessages([{ id: 'greeting', from: 'bot', text: botGreeting }]);
  }, [botGreeting]);

  useEffect(() => {
    if (hasPrompted) return;
    const timeout = window.setTimeout(() => {
      setIsOpen(true);
      setHasPrompted(true);
    }, 4000);
    return () => window.clearTimeout(timeout);
  }, [hasPrompted]);

  useEffect(() => {
    if (typeof document === 'undefined' || !isOpen) return;

    try {
      const nodes = Array.from(document.querySelectorAll('h1, h2, h3, p, li'));
      const snippets: SiteSnippet[] = [];

      for (const node of nodes) {
        if (node.closest('[data-sales-bot-root="true"]')) continue;

        const rawText = node.textContent?.replace(/\s+/g, ' ').trim() || '';
        if (rawText.length < 40) continue;

        const title = node.tagName.toLowerCase().startsWith('h')
          ? copy.websiteHeading
          : copy.websiteContent;

        snippets.push({ title, content: rawText.slice(0, MAX_SNIPPET_LENGTH) });
        if (snippets.length >= 24) break;
      }

      setDomKnowledge(snippets);
    } catch (error) {
      console.error('Failed to collect website snippets for SalesBot:', error);
      setDomKnowledge([]);
    }
  }, [copy.websiteContent, copy.websiteHeading, isOpen, language]);

  const appendMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\u0400-\u04ff\u0590-\u05ff\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const tokenize = (value: string) => normalize(value).split(' ').filter((token) => token.length > 1);

  const shorten = (value: string) => (value.length > MAX_SNIPPET_LENGTH ? `${value.slice(0, MAX_SNIPPET_LENGTH - 1)}...` : value);

  const pushBotReply = (text: string) => {
    const finalText = hasLeadSubmitted ? text : `${text}\n\n${leadCta}`;
    appendMessage({ id: `bot-${Date.now()}`, from: 'bot', text: finalText });
    if (!hasLeadSubmitted) {
      setCollectingLead(true);
    }
  };

  const answerFromWebsite = (question: string) => {
    const normalizedQuestion = normalize(question);
    const qTokens = Array.from(new Set(tokenize(question)));
    const hasAny = (words: string[]) => words.some((word) => normalizedQuestion.includes(word));

    if (hasAny(['מחיר', 'מחירים', 'עלות', 'כמה עולה', 'pricing', 'price', 'plan', 'tarif', 'prix', 'цена', 'стоим', 'preço', 'preco', 'plano'])) {
      return `${copy.sitePrefix}: ${tf('landing.pricingSubtitle', copy.pricingFallback)}`;
    }

    if (hasAny(['דמו', 'demo', 'שיחה', 'פגישה', 'демо', 'démonstration', 'démo', 'demonstracao', 'demonstração'])) {
      return `${copy.sitePrefix}: ${tf('landing.s3_desc')}`;
    }

    if (hasAny(['אינטגרציה', 'אינטגרציות', 'integration', 'integrations', 'интегра', 'integra', 'intégration', 'google', 'meta', 'tiktok', 'woocommerce', 'ווקומרס'])) {
      return `${copy.sitePrefix}: ${tf('integrations.platforms.google.desc', copy.integrationsGoogle)} ${tf('integrations.platforms.meta.desc', copy.integrationsMeta)} ${tf('integrations.platforms.tiktok.desc', copy.integrationsTikTok)} ${tf('integrations.platforms.woocommerce.desc', copy.integrationsWoo)}`;
    }

    if (hasAny(['roi', 'roas', 'רווח', 'רווחיות', 'תשואה', 'profit', 'rentab', 'доход', 'прибыл', 'lucro', 'rentabilidade', 'rentabilité'])) {
      return `${copy.sitePrefix}: ${tf('profitability.subtitle')}`;
    }

    let best: { snippet: SiteSnippet; score: number } | null = null;
    for (const snippet of knowledge) {
      const blob = normalize(`${snippet.title} ${snippet.content}`);
      let score = 0;

      for (const token of qTokens) {
        if (blob.includes(token)) score += 1;
      }

      if (normalizedQuestion && blob.includes(normalizedQuestion)) score += 2;

      if (!best || score > best.score) {
        best = { snippet, score };
      }
    }

    if (best && best.score > 0) {
      return `${copy.siteContentPrefix} (${best.snippet.title}): ${shorten(best.snippet.content)}`;
    }

    return copy.noMatch;
  };

  const getSafeAnswerFromWebsite = (question: string) => {
    try {
      return answerFromWebsite(question);
    } catch (error) {
      console.error('SalesBot failed to answer question:', error);
      return copy.noMatch;
    }
  };

  const handleQuickIntent = (intent: QuickIntent, label: string) => {
    appendMessage({ id: `user-${intent}-${Date.now()}`, from: 'user', text: label });
    setSubmitError(null);

    if (intent === 'lead') {
      setCollectingLead(true);
      pushBotReply(copy.leadPrompt);
      return;
    }

    const syntheticQuestion: Record<Exclude<QuickIntent, 'lead'>, string> = {
      pricing: copy.syntheticPricing,
      demo: copy.syntheticDemo,
      integrations: copy.syntheticIntegrations,
      roi: copy.syntheticRoi,
    };

    pushBotReply(getSafeAnswerFromWebsite(syntheticQuestion[intent]));
  };

  const handleAskQuestion = () => {
    const question = userQuestion.trim();
    if (!question) return;

    appendMessage({ id: `user-open-${Date.now()}`, from: 'user', text: question });
    setUserQuestion('');
    setSubmitError(null);
    pushBotReply(getSafeAnswerFromWebsite(question));
  };

  const handleLeadSubmit = async () => {
    const hasContact = lead.email.trim() || lead.phone.trim();
    if (!lead.name.trim() || !hasContact) {
      setSubmitError(
        copy.submitErrorContact
      );
      return;
    }

    setIsSubmittingLead(true);
    setSubmitError(null);
    try {
      await createPublicSalesLead({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        website: lead.website,
        sourcePath: window.location.pathname,
        message: language === 'he' ? 'ליד מהבוט באתר' : 'Lead from on-site sales bot',
      });

      appendMessage({
        id: `bot-lead-success-${Date.now()}`,
        from: 'bot',
        text: copy.leadSaved,
      });

      setLead({ name: '', email: '', phone: '', website: '' });
      setCollectingLead(false);
      setHasLeadSubmitted(true);
    } catch (error) {
      console.error('Failed to save lead:', error);
      setSubmitError(
        copy.saveLeadError
      );
    } finally {
      setIsSubmittingLead(false);
    }
  };

  return (
    <div
      data-sales-bot-root="true"
      className={cn('fixed z-[120]', dir === 'rtl' ? 'left-4 sm:left-6' : 'right-4 sm:right-6', 'bottom-4 sm:bottom-6')}
      dir={dir}
    >
      {isOpen && (
        <div className="mb-3 w-[calc(100vw-2rem)] sm:w-[390px] bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-4 py-3 bg-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              <p className="text-sm font-bold">{copy.botTitle}</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-md hover:bg-white/15 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-[320px] overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-[#0b0b0b]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'rounded-xl px-3 py-2 text-sm leading-relaxed max-w-[92%] whitespace-pre-line',
                  message.from === 'bot'
                    ? 'bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100'
                    : 'bg-indigo-600 text-white ms-auto'
                )}
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#111] space-y-2">
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((reply) => (
                <button
                  key={reply.id}
                  onClick={() => handleQuickIntent(reply.id, reply.label)}
                  className="px-2.5 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  {reply.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <MessageSquareText className="w-4 h-4" />
              </div>
              <input
                value={userQuestion}
                onChange={(event) => setUserQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleAskQuestion();
                }}
                placeholder={copy.askPlaceholder}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={handleAskQuestion}
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
              >
                {copy.askButton}
              </button>
            </div>

            {!hasLeadSubmitted && (
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 px-3 py-2 text-xs text-indigo-900">
                {leadCta}
                <button
                  onClick={() => setCollectingLead(true)}
                  className="ms-1 font-bold underline decoration-indigo-400 hover:decoration-indigo-700"
                >
                  {copy.leaveNow}
                </button>
              </div>
            )}

            {collectingLead && !hasLeadSubmitted && (
              <div className="space-y-2">
                <input
                  value={lead.name}
                  onChange={(event) => setLead((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder={copy.fullName}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    value={lead.email}
                    onChange={(event) => setLead((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder={copy.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    value={lead.phone}
                    onChange={(event) => setLead((prev) => ({ ...prev, phone: event.target.value }))}
                    placeholder={copy.phone}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <input
                  value={lead.website}
                  onChange={(event) => setLead((prev) => ({ ...prev, website: event.target.value }))}
                  placeholder={copy.websiteOptional}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  dir="ltr"
                />
                {submitError && <p className="text-xs text-red-600">{submitError}</p>}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleLeadSubmit}
                    disabled={isSubmittingLead}
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmittingLead
                      ? copy.saving
                      : copy.sendDetails}
                  </button>
                  <button
                    onClick={() => setCollectingLead(false)}
                    className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
                  >
                    {copy.later}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <a href="/auth" className="text-xs text-indigo-600 font-bold hover:underline">
                {copy.quickLogin}
              </a>
              <span className="text-[11px] text-gray-400 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {copy.aiAssistant}
              </span>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl hover:bg-indigo-700 transition-colors flex items-center justify-center"
        aria-label={copy.openAria}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
