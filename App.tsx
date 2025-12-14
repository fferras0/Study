
import React, { useState, useRef, useEffect } from 'react';
import { ScenarioType, GameStatus, SimulationState, SetupConfig, LogEntry, ActionEstimate, Language } from './types';
import * as GeminiService from './services/geminiService';
import StatBar from './components/StatBar';
import Typewriter from './components/Typewriter';
import LoadingOverlay from './components/LoadingOverlay';
import GameOverScreen from './components/GameOverScreen';

// --- TRANSLATIONS ---
const TRANSLATIONS = {
  [Language.AR]: {
    appTitle: "SimuLearn",
    appSubtitle: "",
    selectLang: "اختر لغة الواجهة",
    introDesc: "بيئة محاكاة ذكية (SimuLearn) لتوليد سيناريوهات طبية، هندسية، وبرمجية معقدة. تعتمد على الذكاء الاصطناعي لاختبار مهارات حل المشكلات.",
    startBtn: "بـدء محـاكاة جديـدة",
    resumeBtn: "📂 استكمال الجلسة السابقة",
    setupTitle: "تكوين سيناريو المحاكاة",
    backBtn: "العودة للقائمة",
    domainLabel: "مجال التخصص",
    domainMedical: "طب الطوارئ والحالات الحرجة",
    domainEngineering: "الهندسة الصناعية والميكانيكية",
    domainProgramming: "تخصص أكواد البرمجة (Coding)",
    domainCybersecurity: "الأمن السيبراني (Cybersecurity)",
    difficultyLabel: "مستوى التعقيد",
    diffEasy: "تدريب (مبتدئ)",
    diffMedium: "ميداني (ممارس)",
    diffHard: "أزمة حرجة (خبير)",
    loadingSetup: "انشاء سيناريو...",
    loadingTranslate: "جاري ترجمة سياق المحاكاة والسجلات...",
    startSimBtn: "إطلاق بيئة المحاكاة",
    round: "دورة اتخاذ القرار",
    medicalRoom: "غرفة العناية / العمليات",
    workshop: "موقع العمليات الميدانية",
    serverRoom: "بيئة التطوير / Terminal",
    securityRoom: "غرفة العمليات السيبرانية (SOC)",
    prevResult: "تقرير نتائج الإجراء السابق",
    missionSuccess: "تم تحقيق أهداف المهمة بنجاح",
    missionFail: "فشل المهمة: خروج الوضع عن السيطرة",
    newScenario: "القائمة الرئيسية",
    tryAgain: "إعادة المحاولة",
    reviewBtn: "مراجعة السيناريو",
    returnToResult: "عرض النتيجة النهائية",
    actionsLabel: "خيارات التدخل المتاحة",
    customActionBtn: "اقترح حلاً إبداعياً",
    customActionTitle: "وضع الحلول الإبداعية (Creativity Mode)",
    customActionDesc: "هنا يمكنك اقتراح إجراء غير موجود في القائمة. سيقوم النظام بتحليل جدوى الإجراء ومخاطره فيزيائياً وطبياً قبل التنفيذ.",
    customActionPlaceholder: "مثال: سأقوم بعمل شق حنجري عاجل باستخدام أدوات بديلة لتأمين المجرى الهوائي...",
    analyzeBtn: "محاكاة التبعات (Risk Analysis)",
    analysisTitle: "تحليل التبعات المتوقعة",
    timeLabel: "النافذة الزمنية",
    costLabel: "الميزانية المتاحة",
    riskLabel: "مؤشر الخطورة",
    adviceLabel: "توصية الذكاء الاصطناعي",
    editBtn: "تعديل الصياغة",
    confirmBtn: "اعتماد وتنفيذ",
    dashboardTitle: "المؤشرات الحيوية ولوحة القيادة",
    goalLabel: "الهدف الاستراتيجي للمهمة",
    statusLabel: "استقرار الحالة / النظام",
    budgetLabel: "الموارد المالية",
    logTitle: "سجل القرارات والأحداث",
    noLogs: "بانتظار الإجراء الأول...",
    loading: "جاري المعالجة والتحليل...",
    readAloud: "قراءة صوتية",
    stopReading: "إيقاف",
    saveAndExit: "حفظ وخروج",
  },
  [Language.EN]: {
    appTitle: "SimuLearn",
    appSubtitle: "",
    selectLang: "Select Simulation Language",
    introDesc: "An advanced AI-driven environment (SimuLearn) for generating realistic medical, engineering, and software scenarios.",
    startBtn: "Generate New Scenario",
    resumeBtn: "📂 Resume Saved Session",
    setupTitle: "Mission Configuration",
    backBtn: "Change Language",
    domainLabel: "Specialization",
    domainMedical: "Emergency Medicine",
    domainEngineering: "Industrial Engineering",
    domainProgramming: "Coding & Debugging Specialization",
    domainCybersecurity: "Cybersecurity & Networks",
    difficultyLabel: "Complexity Level",
    diffEasy: "Training (Easy)",
    diffMedium: "Field (Medium)",
    diffHard: "Crisis (Hard)",
    loadingSetup: "Creating scenario...",
    loadingTranslate: "Translating scenario and logs...",
    startSimBtn: "Initialize Simulation",
    round: "Decision Cycle",
    medicalRoom: "Operating Theater",
    workshop: "Field Site",
    serverRoom: "Dev Environment / Terminal",
    securityRoom: "Security Operations Center (SOC)",
    prevResult: "Previous Status Report",
    missionSuccess: "Mission Accomplished",
    missionFail: "Mission Failed",
    newScenario: "Main Menu",
    tryAgain: "Retry",
    reviewBtn: "Review Scenario",
    returnToResult: "Show Final Result",
    actionsLabel: "Intervention Protocols",
    customActionBtn: "Creative Solution",
    customActionTitle: "Custom Action (Creativity Mode)",
    customActionDesc: "Describe your intended action precisely. Physics/Medical consequences will be analyzed.",
    customActionPlaceholder: "Ex: Perform an emergency cricothyrotomy to secure airway...",
    analyzeBtn: "Risk Analysis",
    analysisTitle: "Pre-Simulation Forecast",
    timeLabel: "Time Window",
    costLabel: "Budget",
    riskLabel: "Risk Factor",
    adviceLabel: "System Rec.",
    editBtn: "Edit",
    confirmBtn: "Execute",
    dashboardTitle: "Vital Telemetry",
    goalLabel: "Primary Objective",
    statusLabel: "System/Patient Integrity",
    budgetLabel: "Resources",
    logTitle: "Event Log",
    noLogs: "Awaiting input...",
    loading: "Executing...",
    readAloud: "Read",
    stopReading: "Stop",
    saveAndExit: "Save & Exit",
  }
};

const STORAGE_KEY = 'simuLearnSaveData';

const App: React.FC = () => {
  // Application State
  const [lang, setLang] = useState<Language>(Language.AR);
  const [status, setStatus] = useState<GameStatus>(GameStatus.INTRO);
  const [config, setConfig] = useState<SetupConfig>({ type: ScenarioType.MEDICAL, difficulty: 'EASY' });
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [turnCount, setTurnCount] = useState<number>(0);
  const [hasSave, setHasSave] = useState(false);
  
  // Game State
  const [gameState, setGameState] = useState<SimulationState | null>(null);

  // UI State
  const [isReviewing, setIsReviewing] = useState(false);

  // Custom Action State
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customActionText, setCustomActionText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [estimation, setEstimation] = useState<ActionEstimate | null>(null);
  
  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Refs for auto-scrolling
  const logEndRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang];
  const isRTL = lang === Language.AR;

  // --- PERSISTENCE ---

  useEffect(() => {
    // Check for save on mount
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      setHasSave(true);
    }
  }, []);

  useEffect(() => {
    // Update HTML dir and lang attributes for correct font/scrollbar behavior
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = isRTL ? 'ar' : 'en';
  }, [lang, isRTL]);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Auto-save logic
  useEffect(() => {
    if (status === GameStatus.PLAYING && gameState) {
      const dataToSave = {
        config,
        logs,
        turnCount,
        gameState,
        savedLang: lang 
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      setHasSave(true);
    } 
  }, [status, gameState, logs, turnCount, config, lang]);

  const handleSaveAndExit = () => {
      // Explicit save before exit (redundant with auto-save but safer)
      if (gameState) {
          const dataToSave = { config, logs, turnCount, gameState, savedLang: lang };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
          setHasSave(true);
      }
      setStatus(GameStatus.INTRO);
      setIsReviewing(false);
  };


  // --- LOGIC ---

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat(lang === Language.AR ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }
      
      // Stop any previous speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      // Attempt to set a voice appropriate for the language
      utterance.lang = lang === Language.AR ? 'ar-SA' : 'en-US';
      utterance.rate = 0.9; // Slightly slower for clarity
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("TTS not supported in this browser.");
    }
  };

  const handleError = (error: any) => {
    console.error(error);
    const defaultMsg = lang === Language.AR ? "حدث خطأ في الاتصال بالخادم" : "Server Connection Error";
    let msg = error?.message || defaultMsg;
    
    // If it's the specific "API Key expired" message, make sure it's shown clearly
    if (msg.includes("API key expired")) {
        msg = lang === Language.AR ? 
            "عذراً، انتهت صلاحية مفتاح API. يرجى تحديث بيانات الاعتماد." : 
            "API Key Expired. Please refresh your credentials.";
    }
    alert(msg);
  };

  const handleResumeGame = async () => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setConfig(data.config);
        setTurnCount(data.turnCount);
        setIsReviewing(false);
        
        // Detect language mismatch
        // If the save file language is different from the current selected language, translate the state.
        if (data.savedLang && data.savedLang !== lang) {
            setLoading(true);
            setLoadingText(t.loadingTranslate);
            try {
              // Run both translations in parallel
              const [translatedState, translatedLogs] = await Promise.all([
                  GeminiService.translateGameState(data.gameState, lang),
                  GeminiService.translateLogs(data.logs, lang)
              ]);
              
              setGameState(translatedState);
              setLogs(translatedLogs);
            } catch (error) {
              console.error("Translation failed during resume, falling back to original");
              setGameState(data.gameState);
              setLogs(data.logs);
            } finally {
              setLoading(false);
              setLoadingText("");
            }
        } else {
            // Same language, just load
            setGameState(data.gameState);
            setLogs(data.logs);
        }
        
        setStatus(GameStatus.PLAYING);
      } catch (e) {
        console.error("Failed to load save", e);
        localStorage.removeItem(STORAGE_KEY);
        setHasSave(false);
        handleError(e);
      }
    }
  };

  const handleStartGame = async () => {
    setLoading(true);
    setLoadingText(t.loadingSetup);
    setIsReviewing(false);
    
    // Clear old save on new game start
    localStorage.removeItem(STORAGE_KEY);
    setHasSave(false);
    
    setLogs([]);
    setTurnCount(1);
    try {
      const initialState = await GeminiService.startNewGame(config.type, config.difficulty, lang);
      setGameState(initialState);
      setStatus(GameStatus.PLAYING);
      
      setLogs([{
        turn: 1,
        actionTaken: lang === Language.AR ? "بدء تشغيل النظام" : "System Initialization",
        feedback: lang === Language.AR ? "تم تحميل بيانات المحاكاة وتوليد السيناريو." : "Simulation data loaded.",
        timestamp: new Date().toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US')
      }]);
    } catch (error: any) {
      handleError(error);
    } finally {
      setLoading(false);
      setLoadingText("");
    }
  };

  const handleRestartGame = () => {
      // Retain config, clear state, start new
      handleStartGame();
  };

  const executeAction = async (actionLabel: string) => {
    if (!gameState) return;
    setLoading(true);
    setLoadingText(t.loading);
    // Stop speaking when action is taken
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    
    setShowCustomModal(false);
    setEstimation(null);
    setCustomActionText("");

    try {
      const result = await GeminiService.processTurn(
        gameState.description,
        actionLabel,
        gameState,
        config.type,
        lang
      );

      const newHealth = Math.max(0, Math.min(100, gameState.health + (result.rawData.healthChange || 0)));
      const newBudget = Math.max(0, gameState.budget + (result.rawData.budgetChange || 0));
      const newTime = Math.max(0, gameState.timeRemaining + (result.rawData.timeChange || 0));

      let isGameOver = result.isGameOver || false;
      let gameOverReason = result.gameOverReason;
      
      if (!isGameOver) {
        if (newHealth <= 0) {
            isGameOver = true;
            gameOverReason = lang === Language.AR ? "انهيار الحالة بالكامل (0%)." : "Total system failure (0%).";
        } else if (newTime <= 0) {
            isGameOver = true;
            gameOverReason = lang === Language.AR ? "انتهت النافذة الزمنية المتاحة." : "Critical time elapsed.";
        } 
      }

      const newState: SimulationState = {
        ...gameState,
        description: result.description || gameState.description,
        goal: result.goal || gameState.goal,
        imagePrompt: result.imagePrompt || gameState.imagePrompt,
        visualKeyword: "",
        feedback: result.feedback || "",
        options: result.options || [],
        health: newHealth,
        budget: newBudget,
        timeRemaining: newTime,
        isGameOver: isGameOver,
        isVictory: result.isVictory || false,
        gameOverReason: gameOverReason
      };

      setGameState(newState);
      setLogs(prev => [...prev, {
        turn: turnCount + 1,
        actionTaken: actionLabel,
        feedback: result.feedback || "Processing...",
        timestamp: new Date().toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US')
      }]);
      setTurnCount(prev => prev + 1);

      if (newState.isVictory) setStatus(GameStatus.VICTORY);
      else if (newState.isGameOver) setStatus(GameStatus.GAME_OVER);

    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
      setLoadingText("");
    }
  };

  const handleCustomActionAnalyze = async () => {
    if (!customActionText.trim() || !gameState) return;
    setIsAnalyzing(true);
    try {
      const result = await GeminiService.evaluateCustomAction(customActionText, gameState, config.type, lang);
      setEstimation(result);
    } catch (e) {
      handleError(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getDynamicImageUrl = (prompt: string) => {
    if (!prompt) return "https://picsum.photos/1920/1080?grayscale";
    const encodedPrompt = encodeURIComponent(prompt + " cinematic, hyperrealistic, 8k, detailed atmosphere, dramatic lighting");
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1920&height=1080&nologo=true&seed=${turnCount}`;
  };

  const handleLangSelect = (selectedLang: Language) => {
    setLang(selectedLang);
    setStatus(GameStatus.SETUP);
  };

  // --- RENDER ---

  // 1. INTRO SCREEN (Language Selection)
  if (status === GameStatus.INTRO) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent"></div>

        <div className="relative z-10 max-w-2xl w-full bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 md:p-12 shadow-2xl text-center">
            <div className="mb-8">
               <div className="text-6xl mb-4 animate-bounce">🧬</div>
               <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">{t.appTitle}</h1>
               {t.appSubtitle && <p className="text-blue-200/80 text-lg uppercase tracking-widest">{t.appSubtitle}</p>}
            </div>
            
            <p className="text-gray-400 mb-10 leading-relaxed max-w-lg mx-auto">
              {t.introDesc}
            </p>

            <h3 className="text-white font-bold mb-6 flex items-center justify-center gap-2">
              <span className="w-8 h-[1px] bg-gray-600"></span>
              {t.selectLang}
              <span className="w-8 h-[1px] bg-gray-600"></span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
               <button 
                 onClick={() => handleLangSelect(Language.AR)}
                 className="group relative p-6 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl transition-all hover:-translate-y-1 hover:shadow-lg hover:border-blue-500 overflow-hidden"
               >
                 <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <span className="text-2xl block mb-2">🇸🇦</span>
                 <span className="text-xl font-bold text-white">العربية</span>
               </button>

               <button 
                 onClick={() => handleLangSelect(Language.EN)}
                 className="group relative p-6 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl transition-all hover:-translate-y-1 hover:shadow-lg hover:border-blue-500 overflow-hidden"
               >
                 <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <span className="text-2xl block mb-2">🇺🇸</span>
                 <span className="text-xl font-bold text-white">English</span>
               </button>
            </div>
        </div>
      </div>
    );
  }

  // 2. SETUP SCREEN
  if (status === GameStatus.SETUP) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 p-4 font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-2xl w-full bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden relative">
          
          {loading && <LoadingOverlay text={loadingText} />}

          {/* Header */}
          <div className="bg-gray-800 p-6 flex justify-between items-center border-b border-gray-700">
             <h2 className="text-2xl font-bold text-white flex items-center gap-3">
               <span className="text-blue-500">⚙️</span> {t.setupTitle}
             </h2>
             <button onClick={() => setStatus(GameStatus.INTRO)} className="text-gray-400 hover:text-white text-sm bg-gray-900/50 px-3 py-1 rounded-full transition-colors">
               {t.backBtn}
             </button>
          </div>

          <div className="p-8 space-y-8">
            {/* Domain Selection */}
            <div>
              <label className="block text-gray-400 mb-3 text-sm font-bold uppercase tracking-wider">{t.domainLabel}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button 
                  onClick={() => setConfig({ ...config, type: ScenarioType.MEDICAL })} 
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all ${config.type === ScenarioType.MEDICAL ? 'border-red-500 bg-red-900/10' : 'border-gray-800 bg-gray-800/50 hover:border-gray-600'}`}
                >
                  <div className={`text-2xl mb-2 ${config.type === ScenarioType.MEDICAL ? 'scale-110' : 'grayscale opacity-50'} transition-all`}>🚑</div>
                  <div className={`font-bold text-xs ${config.type === ScenarioType.MEDICAL ? 'text-white' : 'text-gray-400'}`}>{t.domainMedical}</div>
                </button>
                <button 
                  onClick={() => setConfig({ ...config, type: ScenarioType.ENGINEERING })} 
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all ${config.type === ScenarioType.ENGINEERING ? 'border-amber-500 bg-amber-900/10' : 'border-gray-800 bg-gray-800/50 hover:border-gray-600'}`}
                >
                  <div className={`text-2xl mb-2 ${config.type === ScenarioType.ENGINEERING ? 'scale-110' : 'grayscale opacity-50'} transition-all`}>🏗️</div>
                  <div className={`font-bold text-xs ${config.type === ScenarioType.ENGINEERING ? 'text-white' : 'text-gray-400'}`}>{t.domainEngineering}</div>
                </button>
                <button 
                  onClick={() => setConfig({ ...config, type: ScenarioType.PROGRAMMING })} 
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all ${config.type === ScenarioType.PROGRAMMING ? 'border-purple-500 bg-purple-900/10' : 'border-gray-800 bg-gray-800/50 hover:border-gray-600'}`}
                >
                  <div className={`text-2xl mb-2 ${config.type === ScenarioType.PROGRAMMING ? 'scale-110' : 'grayscale opacity-50'} transition-all`}>💻</div>
                  <div className={`font-bold text-xs ${config.type === ScenarioType.PROGRAMMING ? 'text-white' : 'text-gray-400'}`}>{t.domainProgramming}</div>
                </button>
                 <button 
                  onClick={() => setConfig({ ...config, type: ScenarioType.CYBERSECURITY })} 
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all ${config.type === ScenarioType.CYBERSECURITY ? 'border-emerald-500 bg-emerald-900/10' : 'border-gray-800 bg-gray-800/50 hover:border-gray-600'}`}
                >
                  <div className={`text-2xl mb-2 ${config.type === ScenarioType.CYBERSECURITY ? 'scale-110' : 'grayscale opacity-50'} transition-all`}>🔐</div>
                  <div className={`font-bold text-xs ${config.type === ScenarioType.CYBERSECURITY ? 'text-white' : 'text-gray-400'}`}>{t.domainCybersecurity}</div>
                </button>
              </div>
            </div>

            {/* Difficulty Selection */}
            <div>
              <label className="block text-gray-400 mb-3 text-sm font-bold uppercase tracking-wider">{t.difficultyLabel}</label>
              <div className="grid grid-cols-3 gap-2 bg-gray-800 p-1.5 rounded-xl">
                {['EASY', 'MEDIUM', 'HARD'].map((d) => (
                  <button 
                    key={d}
                    onClick={() => setConfig({ ...config, difficulty: d as any })} 
                    className={`py-3 rounded-lg text-sm font-bold transition-all ${config.difficulty === d ? 
                      (d === 'EASY' ? 'bg-green-600 text-white shadow-lg' : d === 'MEDIUM' ? 'bg-blue-600 text-white shadow-lg' : 'bg-red-600 text-white shadow-lg') 
                      : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    {d === 'EASY' ? t.diffEasy : d === 'MEDIUM' ? t.diffMedium : t.diffHard}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <button onClick={handleStartGame} disabled={loading} className="w-full py-4 bg-white hover:bg-gray-100 text-gray-900 font-bold text-lg rounded-xl shadow-lg transition-all transform active:scale-[0.99] flex justify-center items-center gap-3">
                {t.startSimBtn}
              </button>
              
              {hasSave && (
                <button onClick={handleResumeGame} disabled={loading} className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-blue-300 border border-gray-700 font-semibold rounded-xl transition-all flex justify-center items-center gap-2">
                   {t.resumeBtn}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. GAMEPLAY SCREEN
  return (
    <div className="h-screen w-screen overflow-hidden bg-black relative font-sans text-gray-100" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Loading Overlay */}
      {loading && <LoadingOverlay text={loadingText} />}

      {/* Game Over / Victory Overlay */}
      {(status === GameStatus.GAME_OVER || status === GameStatus.VICTORY) && (
        <>
            {!isReviewing ? (
                <GameOverScreen 
                    status={status} 
                    gameState={gameState} 
                    onRestart={handleRestartGame} 
                    onHome={() => setStatus(GameStatus.INTRO)} 
                    onReview={() => setIsReviewing(true)}
                    t={t} 
                />
            ) : (
                <div className="absolute top-20 right-4 z-40 animate-fade-in">
                    <button 
                        onClick={() => setIsReviewing(false)}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold shadow-lg border-2 border-indigo-400/50 flex items-center gap-2"
                    >
                        <span>🏆</span> {t.returnToResult}
                    </button>
                </div>
            )}
        </>
      )}

      {/* --- BACKGROUND LAYER --- */}
      <div className="absolute inset-0 z-0 select-none">
         {gameState?.imagePrompt && (
            <img 
              key={turnCount}
              src={getDynamicImageUrl(gameState.imagePrompt)}
              alt="Scenario Atmosphere"
              className="w-full h-full object-cover opacity-80 scale-105 transition-transform duration-[20s] ease-linear"
            />
         )}
         {/* Vignette & Gradients for UI readability */}
         <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-900/60 to-transparent"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/40 to-transparent"></div>
         <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>
      </div>

      {/* --- MAIN CONTENT CONTAINER --- */}
      <div className="relative z-10 h-full w-full flex flex-col md:flex-row p-2 md:p-6 gap-4">
        
        {/* LEFT/CENTER: NARRATIVE & CONTROLS */}
        <div className="flex-1 flex flex-col h-full gap-4 max-w-5xl mx-auto w-full">
            
            {/* Header Status Bar */}
            <div className="shrink-0 flex items-center justify-between bg-black/40 backdrop-blur-md border border-white/10 p-3 rounded-full px-6">
                <div className="flex items-center gap-3">
                    <button onClick={handleSaveAndExit} className="mr-2 text-xs bg-gray-800 hover:bg-red-900/50 text-gray-300 px-3 py-1 rounded-full border border-gray-700 transition-colors">
                        💾 {t.saveAndExit}
                    </button>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="font-bold tracking-wider text-sm uppercase hidden sm:inline">
                      {config.type === ScenarioType.MEDICAL ? t.medicalRoom : 
                       config.type === ScenarioType.ENGINEERING ? t.workshop : 
                       config.type === ScenarioType.CYBERSECURITY ? t.securityRoom : t.serverRoom}
                    </span>
                </div>
                <div className="font-mono text-blue-400 font-bold">{t.round} {turnCount}</div>
            </div>

            {/* Narrative Card */}
            <div className="flex-1 bg-gray-950/70 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl overflow-y-auto scroll-smooth relative group">
                {/* Feedback Toast */}
                {gameState?.feedback && (
                  <div className="mb-6 p-4 bg-blue-500/10 border-l-2 border-blue-500 rounded-r-lg">
                    <div className="text-[10px] text-blue-400 uppercase font-bold mb-1">{t.prevResult}</div>
                    <p className="text-gray-200 text-sm">{gameState.feedback}</p>
                  </div>
                )}

                {/* Main Text */}
                <div className="prose prose-invert prose-lg max-w-none">
                    {loading && !gameState ? (
                        <div className="flex flex-col gap-3 animate-pulse">
                            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-700 rounded w-full"></div>
                            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                        </div>
                    ) : (
                        gameState && (
                          <div className="relative">
                            <Typewriter text={gameState.description} key={turnCount + (lang as string)}>
                               <button 
                                  onClick={() => speakText(gameState.description)}
                                  className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${isSpeaking ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                                >
                                  {isSpeaking ? t.stopReading : t.readAloud}
                                  {isSpeaking && <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>}
                                </button>
                            </Typewriter>
                          </div>
                        )
                    )}
                </div>
            </div>

            {/* Actions Deck */}
            {status === GameStatus.PLAYING && (
                <div className="shrink-0">
                    <div className="flex justify-between items-end mb-2 px-1">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.actionsLabel}</div>
                      <button onClick={() => setShowCustomModal(true)} className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 transition-colors">
                        <span>✨ {t.customActionBtn}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {gameState?.options.map((option) => (
                           <button
                             key={option.id}
                             disabled={loading}
                             onClick={() => executeAction(option.label)}
                             className="group relative flex flex-col items-start p-4 bg-gray-900/80 hover:bg-gray-800 backdrop-blur-md border border-white/5 hover:border-blue-500/50 rounded-xl transition-all text-start"
                           >
                             <span className="font-semibold text-gray-200 group-hover:text-white transition-colors text-sm">{option.label}</span>
                             <div className="flex gap-3 mt-2 text-[10px] font-mono text-gray-500 uppercase">
                                <span>⌛ {option.timeCost}m</span>
                                {/* Budget display removed from card */}
                                {/* <span className="text-emerald-300">{formatMoney(option.cost)}</span> */}
                                <span className={`${option.risk.includes('High') || option.risk.includes('عالية') ? 'text-red-400' : 'text-green-400'}`}>⚠️ {option.risk}</span>
                             </div>
                           </button>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* RIGHT: DASHBOARD (HUD) */}
        <div className="hidden lg:flex w-80 flex-col gap-4">
             {/* Objective Card */}
             <div className="bg-indigo-950/80 backdrop-blur-xl p-5 rounded-2xl border border-indigo-500/30 shadow-lg">
                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">{t.goalLabel}</div>
                <div className="text-sm font-medium text-indigo-100 leading-relaxed">
                   {gameState?.goal}
                </div>
             </div>

             {/* Stats */}
             <div className="bg-gray-950/60 backdrop-blur-xl p-5 rounded-2xl border border-white/5 flex-1 flex flex-col gap-2">
                 <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">{t.dashboardTitle}</h4>
                 {gameState && (
                    <>
                       <StatBar label={t.statusLabel} value={gameState.health} maxValue={100} color={gameState.health > 50 ? 'bg-emerald-500' : 'bg-red-500'} icon="❤️" />
                       <StatBar label={t.timeLabel} value={gameState.timeRemaining} maxValue={60} color="bg-sky-500" icon="⏱️" />
                       {/* Budget StatBar removed */}
                       {/* <StatBar label={t.budgetLabel} value={gameState.budget} maxValue={1000} color="bg-amber-500" icon="💳" isCurrency /> */}
                    </>
                 )}
                 
                 {/* Mini Log */}
                 <div className="mt-auto pt-4 border-t border-white/5">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">{t.logTitle}</div>
                    <div className="h-32 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {logs.slice(-3).reverse().map((log, i) => (
                            <div key={i} className="text-xs text-gray-400 border-l border-gray-700 pl-2">
                                <span className="text-gray-500 text-[10px]">{log.timestamp}</span>
                                <div className="text-gray-300 truncate">{log.actionTaken}</div>
                            </div>
                        ))}
                    </div>
                 </div>
             </div>
        </div>
      </div>

      {/* MODAL: CUSTOM ACTION */}
      {showCustomModal && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gray-900 w-full max-w-lg rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
               <h3 className="text-sm font-bold text-white uppercase tracking-wider">{t.customActionTitle}</h3>
               <button onClick={() => setShowCustomModal(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            
            <div className="p-6">
              {!estimation ? (
                <>
                  <p className="text-gray-400 text-sm mb-4">{t.customActionDesc}</p>
                  <textarea 
                    className="w-full h-32 bg-black/50 border border-gray-700 rounded-xl p-4 text-white focus:border-blue-500 focus:outline-none resize-none text-sm leading-relaxed"
                    placeholder={t.customActionPlaceholder}
                    value={customActionText}
                    onChange={(e) => setCustomActionText(e.target.value)}
                  />
                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={handleCustomActionAnalyze}
                      disabled={isAnalyzing || !customActionText.trim()}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm disabled:opacity-50 flex items-center gap-2 transition-all"
                    >
                      {isAnalyzing && <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>}
                      {t.analyzeBtn}
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4 animate-fade-in">
                   <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                      <div className="text-[10px] text-blue-400 font-bold uppercase mb-2">{t.analysisTitle}</div>
                      <p className="text-white text-sm font-medium mb-4 leading-relaxed">{estimation.predictedOutcome}</p>
                      
                      <div className="flex gap-4 mb-4 border-t border-gray-700 pt-3">
                         <div className="text-center">
                            <div className="text-[10px] text-gray-500">{t.timeLabel}</div>
                            <div className="text-red-400 font-mono text-xs">-{estimation.estimatedTime}</div>
                         </div>
                         {/* Removed Cost from Analysis Preview */}
                         {/* <div className="text-center">
                            <div className="text-[10px] text-gray-500">{t.costLabel}</div>
                            <div className="text-yellow-400 font-mono text-xs">${estimation.estimatedCost}</div>
                         </div> */}
                         <div className="text-center">
                            <div className="text-[10px] text-gray-500">{t.riskLabel}</div>
                            <div className={`font-bold text-xs ${estimation.estimatedRisk.includes('High') || estimation.estimatedRisk.includes('عالية') ? 'text-red-500' : 'text-green-500'}`}>{estimation.estimatedRisk}</div>
                         </div>
                      </div>
                      
                      <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-xs text-yellow-200">
                         💡 {t.adviceLabel}: {estimation.recommendation}
                      </div>
                   </div>

                   <div className="flex gap-3 pt-2">
                     <button 
                       onClick={() => setEstimation(null)}
                       className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium"
                     >
                       {t.editBtn}
                     </button>
                     <button 
                       onClick={() => executeAction(customActionText)}
                       className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-green-900/20"
                     >
                       {t.confirmBtn}
                     </button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
