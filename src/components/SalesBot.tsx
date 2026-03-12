import React, { useEffect, useMemo, useState } from 'react';
import { Bot, MessageCircle, Send, Sparkles, X, MessageSquareText } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';
import { createPublicSalesLead } from '../lib/firebase';

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

export function SalesBot() {
  const { language, dir, t } = useLanguage();
  const isHebrew = language === 'he';
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

  const botGreeting = isHebrew
    ? 'היי! אני בוט המכירות של BScale 🚀 אפשר לשאול אותי כל שאלה על המערכת, ואני עונה לפי המידע שמופיע באתר.'
    : 'Hi! I am the BScale sales bot 🚀 Ask me anything about the platform and I answer using website content.';

  const leadCta = isHebrew
    ? 'כדי לקבל תכנית מותאמת והצעת מחיר מדויקת — השאר/י פרטים כאן ונחזור אליך מהר.'
    : 'To get a tailored plan and exact pricing, leave your details here and we will contact you quickly.';

  const quickReplies = useMemo(
    () => [
      { id: 'pricing' as QuickIntent, label: isHebrew ? 'מחירים וחבילות' : 'Pricing & plans' },
      { id: 'demo' as QuickIntent, label: isHebrew ? 'לקבוע דמו' : 'Book a demo' },
      { id: 'integrations' as QuickIntent, label: isHebrew ? 'חיבורים נתמכים' : 'Supported integrations' },
      { id: 'roi' as QuickIntent, label: isHebrew ? 'איך זה משפר ROI?' : 'How does it improve ROI?' },
      { id: 'lead' as QuickIntent, label: isHebrew ? 'השארת פרטים' : 'Leave details' },
    ],
    [isHebrew]
  );

  const siteKnowledge = useMemo<SiteSnippet[]>(
    () => [
      {
        title: t('landing.heroTitle'),
        content: t('landing.heroSubtitle'),
      },
      {
        title: t('landing.section2'),
        content: [
          t('landing.f1_title'),
          t('landing.f1_desc'),
          t('landing.f2_title'),
          t('landing.f2_desc'),
          t('landing.f3_title'),
          t('landing.f3_desc'),
          t('landing.f4_title'),
          t('landing.f4_desc'),
          t('landing.f5_title'),
          t('landing.f5_desc'),
          t('landing.f6_title'),
          t('landing.f6_desc'),
          t('landing.f7_title'),
          t('landing.f7_desc'),
          t('landing.f8_title'),
          t('landing.f8_desc'),
        ].join(' • '),
      },
      {
        title: t('landing.pricingTitle'),
        content: `${t('landing.pricingSubtitle')} ${t('landing.plan1Name')} - ${t('landing.plan1Desc')} ${t('landing.plan2Name')} - ${t('landing.plan2Desc')} ${t('landing.plan3Name')} - ${t('landing.plan3Desc')}`,
      },
      {
        title: isHebrew ? 'אינטגרציות' : 'Integrations',
        content: [
          t('integrations.platforms.google.desc'),
          t('integrations.platforms.meta.desc'),
          t('integrations.platforms.tiktok.desc'),
          t('integrations.platforms.woocommerce.desc'),
        ].join(' '),
      },
      {
        title: t('profitability.title'),
        content: `${t('profitability.subtitle')} ${t('landing.f5_desc')}`,
      },
      {
        title: t('landing.section3'),
        content: `${t('landing.s1_desc')} ${t('landing.s2_desc')} ${t('landing.s3_desc')}`,
      },
    ],
    [isHebrew, t]
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

    const nodes = Array.from(document.querySelectorAll('h1, h2, h3, p, li'));
    const snippets: SiteSnippet[] = [];

    for (const node of nodes) {
      if (node.closest('[data-sales-bot-root="true"]')) continue;

      const rawText = node.textContent?.replace(/\s+/g, ' ').trim() || '';
      if (rawText.length < 40) continue;

      const title = node.tagName.toLowerCase().startsWith('h')
        ? (isHebrew ? 'כותרת באתר' : 'Website heading')
        : (isHebrew ? 'תוכן באתר' : 'Website content');

      snippets.push({ title, content: rawText.slice(0, MAX_SNIPPET_LENGTH) });
      if (snippets.length >= 24) break;
    }

    setDomKnowledge(snippets);
  }, [isHebrew, isOpen, language]);

  const appendMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9\u0590-\u05ff\s]/g, ' ')
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

    if (hasAny(['מחיר', 'מחירים', 'עלות', 'כמה עולה', 'pricing', 'price', 'plan'])) {
      return isHebrew
        ? `לפי עמוד התמחור באתר: ${t('landing.pricingSubtitle')}`
        : `Based on the website pricing section: ${t('landing.pricingSubtitle')}`;
    }

    if (hasAny(['דמו', 'demo', 'שיחה', 'פגישה'])) {
      return isHebrew
        ? `לפי האתר, אפשר להתחיל מהר: ${t('landing.s3_desc')}`
        : `According to the site, you can get started quickly: ${t('landing.s3_desc')}`;
    }

    if (hasAny(['אינטגרציה', 'אינטגרציות', 'integration', 'google', 'meta', 'tiktok', 'woocommerce', 'ווקומרס'])) {
      return isHebrew
        ? `מהאתר: ${t('integrations.platforms.google.desc')} ${t('integrations.platforms.meta.desc')} ${t('integrations.platforms.tiktok.desc')} ${t('integrations.platforms.woocommerce.desc')}`
        : `From the site: ${t('integrations.platforms.google.desc')} ${t('integrations.platforms.meta.desc')} ${t('integrations.platforms.tiktok.desc')} ${t('integrations.platforms.woocommerce.desc')}`;
    }

    if (hasAny(['roi', 'roas', 'רווח', 'רווחיות', 'תשואה'])) {
      return isHebrew
        ? `לפי המידע באתר: ${t('profitability.subtitle')}`
        : `According to the website information: ${t('profitability.subtitle')}`;
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
      if (isHebrew) {
        return `לפי המידע באתר (${best.snippet.title}): ${shorten(best.snippet.content)}`;
      }
      return `Based on website content (${best.snippet.title}): ${shorten(best.snippet.content)}`;
    }

    return isHebrew
      ? 'לא מצאתי תשובה מדויקת במשפט הזה בתוכן הגלוי כרגע, אבל אשמח לשלוח לך תשובה מותאמת אישית אחרי שנכיר את העסק.'
      : 'I could not find an exact match in the currently visible site content, but I can send a tailored answer once I know your business needs.';
  };

  const handleQuickIntent = (intent: QuickIntent, label: string) => {
    appendMessage({ id: `user-${intent}-${Date.now()}`, from: 'user', text: label });
    setSubmitError(null);

    if (intent === 'lead') {
      setCollectingLead(true);
      pushBotReply(
        isHebrew
          ? 'מעולה. מלא/י שם + אימייל או טלפון ואני אדאג שיחזרו אליך עם תכנית מדויקת.'
          : 'Great. Leave your name + email or phone and I will route a tailored plan to you.'
      );
      return;
    }

    const syntheticQuestion: Record<Exclude<QuickIntent, 'lead'>, string> = {
      pricing: isHebrew ? 'מה המחירים?' : 'What are the pricing plans?',
      demo: isHebrew ? 'איך קובעים דמו?' : 'How can I book a demo?',
      integrations: isHebrew ? 'אילו אינטגרציות יש?' : 'What integrations are supported?',
      roi: isHebrew ? 'איך המערכת משפרת רווחיות?' : 'How does the platform improve ROI?',
    };

    pushBotReply(answerFromWebsite(syntheticQuestion[intent]));
  };

  const handleAskQuestion = () => {
    const question = userQuestion.trim();
    if (!question) return;

    appendMessage({ id: `user-open-${Date.now()}`, from: 'user', text: question });
    setUserQuestion('');
    setSubmitError(null);
    pushBotReply(answerFromWebsite(question));
  };

  const handleLeadSubmit = async () => {
    const hasContact = lead.email.trim() || lead.phone.trim();
    if (!lead.name.trim() || !hasContact) {
      setSubmitError(
        isHebrew
          ? 'נא למלא שם + אימייל או טלפון.'
          : 'Please provide a name + email or phone.'
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
        message: isHebrew ? 'ליד מהבוט באתר' : 'Lead from on-site sales bot',
      });

      appendMessage({
        id: `bot-lead-success-${Date.now()}`,
        from: 'bot',
        text: isHebrew
          ? 'מעולה! הפרטים נשמרו במערכת ומנהל המערכת קיבל התראה באפליקציה.'
          : 'Great! Your details were saved and the system administrator received an in-app alert.',
      });

      setLead({ name: '', email: '', phone: '', website: '' });
      setCollectingLead(false);
      setHasLeadSubmitted(true);
    } catch (error) {
      console.error('Failed to save lead:', error);
      setSubmitError(
        isHebrew
          ? 'לא הצלחנו לשמור את הפרטים כרגע. נסה שוב בעוד רגע.'
          : 'Could not save your details right now. Please try again in a moment.'
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
              <p className="text-sm font-bold">{isHebrew ? 'בוט מכירות BScale' : 'BScale Sales Bot'}</p>
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
                placeholder={isHebrew ? 'שאל/י כל שאלה חופשית...' : 'Ask any free-form question...'}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={handleAskQuestion}
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
              >
                {isHebrew ? 'שאל' : 'Ask'}
              </button>
            </div>

            {!hasLeadSubmitted && (
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 px-3 py-2 text-xs text-indigo-900">
                {leadCta}
                <button
                  onClick={() => setCollectingLead(true)}
                  className="ms-1 font-bold underline decoration-indigo-400 hover:decoration-indigo-700"
                >
                  {isHebrew ? 'להשארת פרטים עכשיו' : 'Leave details now'}
                </button>
              </div>
            )}

            {collectingLead && !hasLeadSubmitted && (
              <div className="space-y-2">
                <input
                  value={lead.name}
                  onChange={(event) => setLead((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder={isHebrew ? 'שם מלא' : 'Full name'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    value={lead.email}
                    onChange={(event) => setLead((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder={isHebrew ? 'אימייל' : 'Email'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    value={lead.phone}
                    onChange={(event) => setLead((prev) => ({ ...prev, phone: event.target.value }))}
                    placeholder={isHebrew ? 'טלפון' : 'Phone'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <input
                  value={lead.website}
                  onChange={(event) => setLead((prev) => ({ ...prev, website: event.target.value }))}
                  placeholder={isHebrew ? 'אתר / חנות (אופציונלי)' : 'Website / store (optional)'}
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
                      ? (isHebrew ? 'שומר פרטים...' : 'Saving...')
                      : (isHebrew ? 'שליחת פרטים' : 'Send details')}
                  </button>
                  <button
                    onClick={() => setCollectingLead(false)}
                    className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
                  >
                    {isHebrew ? 'אחר כך' : 'Later'}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <a href="/auth" className="text-xs text-indigo-600 font-bold hover:underline">
                {isHebrew ? 'כניסה מהירה למערכת' : 'Quick login to platform'}
              </a>
              <span className="text-[11px] text-gray-400 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {isHebrew ? 'AI Sales Assistant' : 'AI Sales Assistant'}
              </span>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl hover:bg-indigo-700 transition-colors flex items-center justify-center"
        aria-label={isHebrew ? 'פתח בוט מכירות' : 'Open sales bot'}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
