"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { User } from "@supabase/supabase-js";
import { useParams } from "next/navigation";
import Link from "next/link";
import AirlineLogo from "@/components/AirlineLogo";
import MockAdBanner from "@/components/MockAdBanner";

interface UserProfile {
  id: string;
  home_airport: string | null;
  favorite_airline: string | null;
  favorite_decade: string | null;
  onboarding_completed: boolean;
  pilot_callsign: string | null;
  quiz_high_score: number | null;
  avatar_id: string;
  is_pro?: boolean | null;
  privacy_accepted?: boolean | null;
  newsletter_subscribed?: boolean | null;
}

const AVATARS = [
  { id: "cadet", name: "Cadetto dello Spazio", emoji: "🧑‍🚀", title: "Student Pilot" },
  { id: "captain", name: "Capitano di Linea", emoji: "👨‍✈️", title: "Commercial Captain" },
  { id: "commander", name: "Comandante ATC", emoji: "📡", title: "ATC Commander" },
  { id: "fighter", name: "Pilota Caccia", emoji: "🛩️", title: "Fighter Ace" },
  { id: "drone", name: "Operatore Droni", emoji: "🛸", title: "UAV Specialist" },
  { id: "mechanic", name: "Capo Meccanico", emoji: "🔧", title: "Flight Engineer" },
  { id: "ai_autopilot", name: "AI Autopilota", emoji: "🤖", title: "AI Autopilot" }
];

interface UserCapture {
  id: string;
  type: 'AIRCRAFT' | 'AIRLINE';
  target_id: string;
  status: 'SPOTTED' | 'FLOWN';
}

interface AircraftModel {
  id: string;
  model_name: string;
  type: string | null;
  rarity: string | null;
  max_passengers: number | null;
  range_km: number | null;
  first_flight_year: number | null;
  manufacturers: { name: string } | null;
}

interface Airport {
  id: string;
  name: string;
  iata_code: string;
}

interface AirlineSearchItem {
  id: string;
  name: string;
  iata_code: string | null;
  logo_url: string | null;
}

export default function ProfilePage() {
  const params = useParams();
  const lang = params?.lang || "en";

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [captures, setCaptures] = useState<UserCapture[]>([]);
  const [aircraftModels, setAircraftModels] = useState<AircraftModel[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [savingOnboarding, setSavingOnboarding] = useState(false);

  // Stati Onboarding
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [selectedAirport, setSelectedAirport] = useState("");
  const [airlineQuery, setAirlineQuery] = useState("");
  const [airlineSuggestions, setAirlineSuggestions] = useState<AirlineSearchItem[]>([]);
  const [selectedAirline, setSelectedAirline] = useState<AirlineSearchItem | null>(null);
  const [selectedDecade, setSelectedDecade] = useState("");
  const [pilotCallsign, setPilotCallsign] = useState("");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [capturedAirlines, setCapturedAirlines] = useState<any[]>([]);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [showProBlockModal, setShowProBlockModal] = useState(false);
  const [playsToday, setPlaysToday] = useState(0);

  // Stati Autenticazione Integrata
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "recovery">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authCallsign, setAuthCallsign] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authMessageType, setAuthMessageType] = useState<"info" | "success" | "error">("info");
  const [authPrivacyChecked, setAuthPrivacyChecked] = useState(false);
  const [authNewsletterChecked, setAuthNewsletterChecked] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Stati Autocomplete Aeroporto Onboarding
  const [airportQuery, setAirportQuery] = useState("");

  const filteredAirports = useMemo(() => {
    if (!airportQuery.trim()) return airports.slice(0, 5);
    const query = airportQuery.toLowerCase().trim();
    return airports.filter(a => 
      a.name.toLowerCase().includes(query) || 
      a.iata_code.toLowerCase().includes(query)
    ).slice(0, 6);
  }, [airports, airportQuery]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const action = params.get("action");
      if (action === "signup") {
        setAuthMode("signup");
      }

      const tab = params.get("tab");
      if (tab === "settings" || tab === "airlines" || tab === "quiz" || tab === "teca") {
        setActiveTab(tab as any);
      }
    }
  }, [user]);

  // Stati Dashboard
  const [activeTab, setActiveTab] = useState<"teca" | "airlines" | "quiz" | "settings">("teca");
  const [tecaShowAll, setTecaShowAll] = useState(true);
  const [tecaSearch, setTecaSearch] = useState("");

  // Stati Settings
  const [editCallsign, setEditCallsign] = useState("");
  const [editAirport, setEditAirport] = useState("");
  const [editAirlineQuery, setEditAirlineQuery] = useState("");
  const [editAirlineSuggestions, setEditAirlineSuggestions] = useState<AirlineSearchItem[]>([]);
  const [editSelectedAirline, setEditSelectedAirline] = useState<AirlineSearchItem | null>(null);
  const [editDecade, setEditDecade] = useState("");
  const [editNewsletter, setEditNewsletter] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsMessageType, setSettingsMessageType] = useState<"info" | "success" | "error">("info");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [deleteConfirm1, setDeleteConfirm1] = useState(false);
  const [deleteConfirm2, setDeleteConfirm2] = useState(false);

  // Stati Quiz
  const [quizState, setQuizState] = useState<"idle" | "playing" | "ended">("idle");
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizTimeLeft, setQuizTimeLeft] = useState(15);
  const [quizHighScore, setQuizHighScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const quizTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Caricamento Iniziale Dati
  const initializeProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      setLoading(false);
      setUser(null);
      setProfile(null);
      return;
    }
    setUser(session.user);
    const email = session.user.email || "";
    setIsAdmin(["admin@airdex.com", "mirkogalantucci@gmail.com"].includes(email));

    // Carica Profilo
    let { data: profileData } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (!profileData) {
      // Se non esiste (es. utente creato prima del trigger), crealo
      const { data: newProfile } = await supabase
        .from("user_profiles")
        .insert({ id: session.user.id, onboarding_completed: false })
        .select()
        .single();
      profileData = newProfile;
    }
    setProfile(profileData);

    // Carica Catture
    const { data: capturesData } = await supabase
      .from("user_captures")
      .select("id, type, target_id, status")
      .eq("user_id", session.user.id);
    setCaptures(capturesData || []);

    // Carica Dettagli Compagnie Catturate
    const airlineIds = (capturesData || [])
      .filter(c => c.type === "AIRLINE")
      .map(c => c.target_id);
    
    if (airlineIds.length > 0) {
      const { data: airlinesDetails } = await supabase
        .from("airlines")
        .select("id, name, logo_url, iata_code, website")
        .in("id", airlineIds);
      setCapturedAirlines(airlinesDetails || []);
    }

    // Carica Aerei (per Teca e Domande Quiz)
    const { data: modelsData } = await supabase
      .from("aircraft_models")
      .select("id, model_name, type, rarity, max_passengers, range_km, first_flight_year, manufacturers(name)")
      .order("model_name");
    setAircraftModels((modelsData || []) as unknown as AircraftModel[]);

    // Carica Aeroporti (per onboarding)
    const { data: airportsData } = await supabase
      .from("airports")
      .select("id, name, iata_code")
      .order("name");
    setAirports(airportsData || []);

    // Recupera High Score dal DB (con fallback su localStorage)
    const dbHighScore = (profileData as any)?.quiz_high_score || 0;
    const savedScore = localStorage.getItem(`airdex_quiz_highscore_${session.user.id}`);
    const localHighScore = savedScore ? parseInt(savedScore, 10) : 0;
    const maxHighScore = Math.max(dbHighScore, localHighScore);
    setQuizHighScore(maxHighScore);

    // Sincronizza locale e database se necessario
    if (localHighScore > dbHighScore) {
      await supabase
        .from("user_profiles")
        .update({ quiz_high_score: localHighScore })
        .eq("id", session.user.id);
    }

    // Carica Leaderboard
    const { data: leaderboardData } = await supabase
      .from("user_profiles")
      .select("pilot_callsign, quiz_high_score")
      .order("quiz_high_score", { ascending: false })
      .limit(5);
    setLeaderboard(leaderboardData || []);

    if (profileData) {
      if (profileData.pilot_callsign) {
        setPilotCallsign(profileData.pilot_callsign);
        setEditCallsign(profileData.pilot_callsign);
      }
      setEditAirport(profileData.home_airport || "");
      setEditDecade(profileData.favorite_decade || "");
      setEditNewsletter(profileData.newsletter_subscribed || false);
      if (profileData.favorite_airline) {
        setEditSelectedAirline({
          id: "",
          name: profileData.favorite_airline,
          iata_code: null,
          logo_url: null
        });
      }
    }

    // Inizializza playsToday
    const todayStr = new Date().toISOString().split("T")[0];
    const storageKey = `airdex_quiz_plays_${session.user.id}_${todayStr}`;
    const plays = parseInt(localStorage.getItem(storageKey) || "0", 10);
    setPlaysToday(plays);

    setLoading(false);
  }, []);

  useEffect(() => {
    initializeProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setLoading(true);
        await initializeProfile();
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initializeProfile]);

  // Gestori Autenticazione Integrata
  const handleAuthSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) return;
    setAuthLoading(true);
    setAuthMessage("Inizializzazione decrittazione firma radar...");
    setAuthMessageType("info");

    const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });

    if (error) {
      setAuthMessage("Errore di autorizzazione: " + error.message);
      setAuthMessageType("error");
      setAuthLoading(false);
    } else {
      setAuthMessage("Firma digitale autenticata! Caricamento hangar...");
      setAuthMessageType("success");
    }
  };

  const handleAuthSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) return;
    if (!authPrivacyChecked) {
      setAuthMessage("Devi accettare l'Informativa sulla Privacy per registrarti.");
      setAuthMessageType("error");
      return;
    }
    setAuthLoading(true);
    setAuthMessage("Registrazione credenziali nel database radar...");
    setAuthMessageType("info");

    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/${lang}/profile`
      }
    });

    if (error) {
      setAuthMessage("Errore di registrazione: " + error.message);
      setAuthMessageType("error");
      setAuthLoading(false);
    } else {
      setAuthMessage("Firma radar salvata! Controlla la tua casella di posta per confermare la licenza.");
      setAuthMessageType("success");
      setAuthLoading(false);
      
      if (data.user) {
        const profileUpdates: any = {
          privacy_accepted: true,
          newsletter_subscribed: authNewsletterChecked,
          onboarding_completed: false
        };
        if (authCallsign.trim()) {
          profileUpdates.pilot_callsign = authCallsign.toUpperCase();
        }
        await supabase
          .from("user_profiles")
          .update(profileUpdates)
          .eq("id", data.user.id);
      }
    }
  };

  const handleAuthRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) return;
    setAuthLoading(true);
    setAuthMessage("Invio link di reset della chiave radar...");
    setAuthMessageType("info");

    const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
      redirectTo: `${window.location.origin}/${lang}/profile`
    });

    if (error) {
      setAuthMessage("Errore invio email: " + error.message);
      setAuthMessageType("error");
    } else {
      setAuthMessage("Link di ripristino inviato! Controlla la posta elettronica.");
      setAuthMessageType("success");
    }
    setAuthLoading(false);
  };

  const handleAuthGoogleSignIn = async () => {
    setAuthMessage("Collegamento con il database di sicurezza Google...");
    setAuthMessageType("info");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/${lang}/profile`
      }
    });
    if (error) {
      setAuthMessage("Errore OAuth: " + error.message);
      setAuthMessageType("error");
    }
  };

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    const { data } = await supabase
      .from("user_profiles")
      .select("pilot_callsign, quiz_high_score")
      .order("quiz_high_score", { ascending: false })
      .limit(5);
    setLeaderboard(data || []);
    setLoadingLeaderboard(false);
  };

  const handleSelectAvatar = async (avatarId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("user_profiles")
      .update({ avatar_id: avatarId })
      .eq("id", user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, avatar_id: avatarId } : null);
      setShowAvatarEditor(false);
    }
  };

  // Cerca Compagnie Aeree in Impostazioni
  useEffect(() => {
    if (editAirlineQuery.trim().length < 2) {
      setEditAirlineSuggestions([]);
      return;
    }

    const searchAirlines = async () => {
      const { data } = await supabase
        .from("airlines")
        .select("id, name, iata_code, logo_url")
        .ilike("name", `%${editAirlineQuery}%`)
        .limit(6);
      setEditAirlineSuggestions(data || []);
    };

    const delayDebounceFn = setTimeout(() => {
      searchAirlines();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [editAirlineQuery]);

  const handleUpdateProfileSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSettingsLoading(true);
    setSettingsMessage("Aggiornamento telemetria profilo...");
    setSettingsMessageType("info");

    const updates = {
      pilot_callsign: editCallsign.trim() || `PILOT-${user.id.slice(0, 5).toUpperCase()}`,
      home_airport: editAirport || null,
      favorite_airline: editSelectedAirline ? editSelectedAirline.name : null,
      favorite_decade: editDecade || null,
      newsletter_subscribed: editNewsletter
    };

    const { data, error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      setSettingsMessage("Errore durante il salvataggio: " + error.message);
      setSettingsMessageType("error");
    } else {
      setProfile(data);
      setPilotCallsign(data.pilot_callsign || "");
      setSettingsMessage("Licenza e telemetria aggiornate con successo!");
      setSettingsMessageType("success");
    }
    setSettingsLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    if (newPassword !== confirmPassword) {
      setSettingsMessage("Le password non coincidono.");
      setSettingsMessageType("error");
      return;
    }
    if (newPassword.length < 6) {
      setSettingsMessage("La password deve essere di almeno 6 caratteri.");
      setSettingsMessageType("error");
      return;
    }

    setSettingsLoading(true);
    setSettingsMessage("Aggiornamento della chiave crittografica...");
    setSettingsMessageType("info");

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setSettingsMessage("Errore cambio password: " + error.message);
      setSettingsMessageType("error");
    } else {
      setNewPassword("");
      setConfirmPassword("");
      setSettingsMessage("Chiave crittografica aggiornata correttamente!");
      setSettingsMessageType("success");
    }
    setSettingsLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setSettingsLoading(true);
    setSettingsMessage("Inizializzazione procedura di smantellamento hangar...");
    setSettingsMessageType("info");

    const { data, error } = await supabase.rpc("delete_user_self");

    if (error) {
      setSettingsMessage("Errore durante la disattivazione dell'account: " + error.message);
      setSettingsMessageType("error");
      setSettingsLoading(false);
    } else if (data === false) {
      setSettingsMessage("Impossibile smantellare l'hangar. Si è verificato un errore.");
      setSettingsMessageType("error");
      setSettingsLoading(false);
    } else {
      setSettingsMessage("Hangar smantellato. Firma radar rimossa. Disconnessione...");
      setSettingsMessageType("success");
      
      setTimeout(async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        window.location.assign(`/${lang}`);
      }, 2000);
    }
  };

  // 2. Cerca Compagnie Aeree in Onboarding
  useEffect(() => {
    if (airlineQuery.trim().length < 2) {
      setAirlineSuggestions([]);
      return;
    }

    const searchAirlines = async () => {
      const { data } = await supabase
        .from("airlines")
        .select("id, name, iata_code, logo_url")
        .ilike("name", `%${airlineQuery}%`)
        .limit(6);
      setAirlineSuggestions(data || []);
    };

    const delayDebounceFn = setTimeout(() => {
      searchAirlines();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [airlineQuery]);

  // Disconnetti terminale
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  // Salva Onboarding
  const handleCompleteOnboarding = async () => {
    if (!user || !selectedAirport || !selectedAirline || !selectedDecade) return;
    setSavingOnboarding(true);

    const updates = {
      home_airport: selectedAirport,
      favorite_airline: selectedAirline.name,
      favorite_decade: selectedDecade,
      pilot_callsign: pilotCallsign || `PILOT-${user.id.slice(0, 5).toUpperCase()}`,
      onboarding_completed: true
    };

    const { data, error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
    } else {
      console.error("Errore salvataggio onboarding:", error?.message);
    }
    setSavingOnboarding(false);
  };

  // 3. Gestione Catture (Toggle Spotted/Flown)
  const toggleCapture = async (targetId: string, type: 'AIRCRAFT' | 'AIRLINE', status: 'SPOTTED' | 'FLOWN') => {
    if (!user) return;
    const existing = captures.find(c => c.target_id === targetId && c.type === type && c.status === status);

    if (existing) {
      const { error } = await supabase
        .from("user_captures")
        .delete()
        .eq("id", existing.id);
      
      if (!error) {
        setCaptures(prev => prev.filter(c => c.id !== existing.id));
        if (type === "AIRLINE") {
          setCapturedAirlines(prev => prev.filter(a => a.id !== targetId));
        }
      }
    } else {
      const newCapture = {
        user_id: user.id,
        type,
        target_id: targetId,
        status
      };

      const { data, error } = await supabase
        .from("user_captures")
        .insert(newCapture)
        .select()
        .single();
      
      if (!error && data) {
        setCaptures(prev => [...prev, data]);
        if (type === "AIRLINE") {
          const { data: airlineDetails } = await supabase
            .from("airlines")
            .select("id, name, logo_url, iata_code, website")
            .eq("id", targetId)
            .single();
          if (airlineDetails) {
            setCapturedAirlines(prev => [...prev, airlineDetails]);
          }
        }
      }
    }
  };

  // 4. Calcolo Statistiche Collezioni
  const stats = useMemo(() => {
    const totalAircraft = aircraftModels.length || 421;
    const uniqueCapturedAircraft = new Set(
      captures.filter(c => c.type === "AIRCRAFT").map(c => c.target_id)
    ).size;
    const aircraftPercentage = Math.round((uniqueCapturedAircraft / totalAircraft) * 100) || 0;

    const spottedCount = captures.filter(c => c.type === "AIRCRAFT" && c.status === "SPOTTED").length;
    const flownCount = captures.filter(c => c.type === "AIRCRAFT" && c.status === "FLOWN").length;

    const uniqueCapturedAirlines = new Set(
      captures.filter(c => c.type === "AIRLINE").map(c => c.target_id)
    );
    const airlinesCount = uniqueCapturedAirlines.size;

    return {
      aircraftPercentage,
      uniqueCapturedAircraft,
      totalAircraft,
      spottedCount,
      flownCount,
      airlinesCount
    };
  }, [captures, aircraftModels]);

  // 5. Calcolo Achievements (Medagliere)
  const achievements = useMemo(() => {
    const list = [];
    const capturedIds = new Set(captures.filter(c => c.type === "AIRCRAFT").map(c => c.target_id));
    const capturedModels = aircraftModels.filter(m => capturedIds.has(m.id));

    // Achievement 1: Pioniere (Aereo prima del 1960)
    const hasPioneer = capturedModels.some(m => m.first_flight_year && m.first_flight_year < 1960);
    list.push({
      id: "pioneer",
      title: "Pioniere",
      desc: "Cattura un aereo leggendario progettato prima del 1960",
      unlocked: hasPioneer,
      icon: "📜"
    });

    // Achievement 2: Frequent Flyer (5 volati)
    const flownPlanes = captures.filter(c => c.type === "AIRCRAFT" && c.status === "FLOWN").length;
    list.push({
      id: "frequent_flyer",
      title: "Frequent Flyer",
      desc: "Registra almeno 5 velivoli su cui hai volato (FLOWN)",
      unlocked: flownPlanes >= 5,
      icon: "✈️"
    });

    // Achievement 3: Globetrotter (3 compagnie catturate)
    list.push({
      id: "globetrotter",
      title: "Globetrotter",
      desc: "Aggiungi alla tua bacheca almeno 3 compagnie aeree differenti",
      unlocked: stats.airlinesCount >= 3,
      icon: "🌐"
    });

    // Achievement 4: Legendary Hunter (Spottato leggendario)
    const hasLegendary = capturedModels.some(m => m.rarity === "LEGENDARY");
    list.push({
      id: "legendary_hunter",
      title: "Cacciatore Leggendario",
      desc: "Avvista un aeromobile di classe LEGENDARY",
      unlocked: hasLegendary,
      icon: "💎"
    });

    // Achievement 5: Top Gun (Quiz High Score >= 80)
    list.push({
      id: "top_gun",
      title: "Top Gun",
      desc: "Raggiungi un punteggio pari o superiore a 80 nel quiz Spotter Trainer",
      unlocked: quizHighScore >= 80,
      icon: "🎖️"
    });

    return list;
  }, [captures, aircraftModels, stats, quizHighScore]);

  // 6. Filtro ed ordinamento Aerei per Teca
  const filteredTeca = useMemo(() => {
    return aircraftModels.filter(model => {
      const matchesSearch = model.model_name.toLowerCase().includes(tecaSearch.toLowerCase()) ||
        (model.manufacturers?.name || "").toLowerCase().includes(tecaSearch.toLowerCase());
      
      if (!tecaShowAll) {
        const isCaptured = captures.some(c => c.target_id === model.id && c.type === "AIRCRAFT");
        return matchesSearch && isCaptured;
      }
      return matchesSearch;
    });
  }, [aircraftModels, tecaSearch, tecaShowAll, captures]);

  // Compagnie Catturate
  const capturedAirlinesList = useMemo(() => {
    const airlineIds = Array.from(new Set(
      captures.filter(c => c.type === "AIRLINE").map(c => c.target_id)
    ));
    // Poiché non carichiamo tutte le 3.076 compagnie in memoria, risolviamo dinamicamente dal DB quelle catturate
    return airlineIds;
  }, [captures]);

  // 7. MOTORE DEL GIOCO: AEROQUIZ (SPOTTER TRAINER)
  const startQuiz = () => {
    if (aircraftModels.length < 5 || !user) return;

    if (!profile?.is_pro) {
      const todayStr = new Date().toISOString().split("T")[0];
      const storageKey = `airdex_quiz_plays_${user.id}_${todayStr}`;
      const plays = parseInt(localStorage.getItem(storageKey) || "0", 10);
      if (plays >= 3) {
        setShowProBlockModal(true);
        return;
      }
      const newPlays = plays + 1;
      localStorage.setItem(storageKey, String(newPlays));
      setPlaysToday(newPlays);
    }

    setQuizScore(0);
    setCurrentQuestionIdx(0);
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setQuizTimeLeft(15);
    
    // Genera 10 domande casuali basate sulla flotta reale
    const generatedQuestions = [];
    for (let i = 0; i < 10; i++) {
      // Sceglie aereo target
      const targetModel = aircraftModels[Math.floor(Math.random() * aircraftModels.length)];
      const questionType = Math.floor(Math.random() * 3); // 3 tipi di domande
      
      let questionText = "";
      let correctAnswer = "";
      let fakeAnswers: string[] = [];

      if (questionType === 0) {
        // Tipo 0: Costruttore
        questionText = `Quale costruttore produce il modello "${targetModel.model_name}"?`;
        correctAnswer = targetModel.manufacturers?.name || "Sconosciuto";
        
        // Risposte fake da altri costruttori
        const otherManufacturers = Array.from(new Set(
          aircraftModels.map(m => m.manufacturers?.name).filter(Boolean)
        )).filter(name => name !== correctAnswer);
        
        fakeAnswers = otherManufacturers.sort(() => 0.5 - Math.random()).slice(0, 3) as string[];
      } else if (questionType === 1) {
        // Tipo 1: Range
        questionText = `Qual è l'autonomia massima dichiarata (Range) del modello "${targetModel.model_name}"?`;
        correctAnswer = targetModel.range_km ? `${targetModel.range_km.toLocaleString()} km` : "N/A";
        
        if (targetModel.range_km) {
          fakeAnswers = [
            `${(targetModel.range_km * 0.7).toFixed(0)} km`,
            `${(targetModel.range_km * 1.3).toFixed(0)} km`,
            `${(targetModel.range_km * 1.6).toFixed(0)} km`
          ];
        } else {
          fakeAnswers = ["3.500 km", "8.200 km", "14.800 km"];
          correctAnswer = "12.000 km"; // Fallback sicuro
        }
      } else {
        // Tipo 2: Anno primo volo
        questionText = `In quale anno ha effettuato il primo volo l'aereo "${targetModel.model_name}"?`;
        correctAnswer = targetModel.first_flight_year ? String(targetModel.first_flight_year) : "1995";
        
        const year = targetModel.first_flight_year || 1995;
        fakeAnswers = [
          String(year - 8),
          String(year + 5),
          String(year + 12)
        ];
      }

      // Rende uniche e mescola le risposte
      const options = Array.from(new Set([correctAnswer, ...fakeAnswers])).sort(() => 0.5 - Math.random());
      
      generatedQuestions.push({
        questionText,
        correctAnswer,
        options
      });
    }

    setQuizQuestions(generatedQuestions);
    setQuizState("playing");
  };

  // Timer del Quiz
  useEffect(() => {
    if (quizState !== "playing") return;

    quizTimerRef.current = setInterval(() => {
      setQuizTimeLeft(prev => {
        if (prev <= 1) {
          // Tempo scaduto! Procedi al prossimo
          handleAnswerSelect("");
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (quizTimerRef.current) clearInterval(quizTimerRef.current);
    };
  }, [quizState, currentQuestionIdx]);

  const handleAnswerSelect = (option: string) => {
    if (selectedAnswer !== null) return; // Impedisce risposte multiple

    if (quizTimerRef.current) clearInterval(quizTimerRef.current);
    setSelectedAnswer(option);
    
    const correct = option === quizQuestions[currentQuestionIdx].correctAnswer;
    setIsAnswerCorrect(correct);

    if (correct) {
      setQuizScore(prev => prev + 10);
    }

    // Attendi 2 secondi e passa alla prossima o finisci
    setTimeout(() => {
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);
      setQuizTimeLeft(15);
      
      if (currentQuestionIdx < quizQuestions.length - 1) {
        setCurrentQuestionIdx(prev => prev + 1);
      } else {
        setQuizState("ended");
        // Verifica ed eventuale salvataggio High Score
        const finalScore = quizScore + (correct ? 10 : 0);
        if (finalScore > quizHighScore) {
          setQuizHighScore(finalScore);
          if (user) {
            localStorage.setItem(`airdex_quiz_highscore_${user.id}`, String(finalScore));
            
            // Salva su Supabase DB
            supabase
              .from("user_profiles")
              .update({ quiz_high_score: finalScore })
              .eq("id", user.id)
              .then(({ error }) => {
                if (error) {
                  console.error("Errore salvataggio highscore DB:", error.message);
                } else {
                  fetchLeaderboard();
                }
              });
          }
        } else {
          fetchLeaderboard();
        }
      }
    }, 1800);
  };

  // Caricamento in corso
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-cyan-500">
        <div className="w-16 h-16 border-4 border-cyan-900 border-t-cyan-400 rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
        <p className="text-sm font-mono tracking-[0.3em] animate-pulse">AUTENTICAZIONE TERMINALE PILOTA...</p>
      </main>
    );
  }

  // Accesso Negato: Schermata di Login e Registrazione integrata
  if (!user || !profile) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Sfondo Griglia Radar */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl relative z-10 shadow-2xl">
          {/* Header Terminale */}
          <div className="text-center mb-8 font-mono">
            <div className="text-cyan-400 text-xs font-black uppercase tracking-[0.3em] mb-2 flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse"></span>
              Aviation AirDex Terminal
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight">
              Accesso Hangar
            </h1>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-900 mb-6 font-mono text-[10px] tracking-widest uppercase">
            <button
              onClick={() => { setAuthMode("signin"); setAuthMessage(""); }}
              className={`flex-1 py-2 rounded-lg transition-all font-bold ${
                authMode === "signin" ? "bg-slate-900 text-cyan-400 shadow-md border border-slate-850" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Accedi
            </button>
            <button
              onClick={() => { setAuthMode("signup"); setAuthMessage(""); }}
              className={`flex-1 py-2 rounded-lg transition-all font-bold ${
                authMode === "signup" ? "bg-slate-900 text-cyan-400 shadow-md border border-slate-850" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Registrati
            </button>
            <button
              onClick={() => { setAuthMode("recovery"); setAuthMessage(""); }}
              className={`flex-1 py-2 rounded-lg transition-all font-bold ${
                authMode === "recovery" ? "bg-slate-900 text-cyan-400 shadow-md border border-slate-850" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Reset
            </button>
          </div>

          {/* Feedback log */}
          {authMessage && (
            <div className={`mb-6 p-4 rounded-xl border font-mono text-xs text-center transition-all ${
              authMessageType === "error" ? "bg-red-500/10 border-red-500/20 text-red-400" :
              authMessageType === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
              "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 animate-pulse"
            }`}>
              {authMessage}
            </div>
          )}

          <form onSubmit={authMode === "signin" ? handleAuthSignIn : authMode === "signup" ? handleAuthSignUp : handleAuthRecovery} className="space-y-4 font-mono">
            <div>
              <label className="block text-slate-400 text-[10px] uppercase tracking-widest font-black mb-2">Canale Email</label>
              <input 
                type="email" 
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="pilota@airdex.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-slate-850"
                required
              />
            </div>
            
            {authMode !== "recovery" && (
              <div>
                <label className="block text-slate-400 text-[10px] uppercase tracking-widest font-black mb-2">Chiave Accesso (Password)</label>
                <input 
                  type="password" 
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-slate-850"
                  required
                />
              </div>
            )}

            {authMode === "signup" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase tracking-widest font-black mb-2">Callsign Pilota (Opzionale)</label>
                  <input 
                    type="text" 
                    value={authCallsign}
                    onChange={(e) => setAuthCallsign(e.target.value)}
                    placeholder="ES. I-MAVERICK"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-slate-850"
                  />
                  <p className="text-[8px] text-slate-600 mt-1 leading-snug">Configura la tua firma radio per le trasmissioni.</p>
                </div>

                {/* Privacy Consent */}
                <div className="flex items-start gap-3 mt-4 text-[10px] text-slate-400 select-none">
                  <input
                    type="checkbox"
                    id="authPrivacyChecked"
                    checked={authPrivacyChecked}
                    onChange={(e) => setAuthPrivacyChecked(e.target.checked)}
                    className="mt-0.5 rounded border-slate-850 bg-slate-950 text-cyan-500 focus:ring-0 focus:ring-offset-0 focus:outline-none"
                    required
                  />
                  <label htmlFor="authPrivacyChecked" className="leading-snug cursor-pointer">
                    Accetto l'Informativa sulla Privacy ed acconsento al trattamento dei dati. <span className="text-red-500 font-bold">*</span>
                  </label>
                </div>

                {/* Newsletter Consent */}
                <div className="flex items-start gap-3 text-[10px] text-slate-400 select-none">
                  <input
                    type="checkbox"
                    id="authNewsletterChecked"
                    checked={authNewsletterChecked}
                    onChange={(e) => setAuthNewsletterChecked(e.target.checked)}
                    className="mt-0.5 rounded border-slate-850 bg-slate-950 text-cyan-500 focus:ring-0 focus:ring-offset-0 focus:outline-none"
                  />
                  <label htmlFor="authNewsletterChecked" className="leading-snug cursor-pointer">
                    Desidero iscrivermi alla newsletter AvGeek per ricevere segnali radar e info travel hacks.
                  </label>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={authLoading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-3.5 rounded-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/10 cursor-pointer"
            >
              {authLoading && <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>}
              <span>
                {authMode === "signin" ? "Autentica Licenza" : authMode === "signup" ? "Registra Nuova Licenza" : "Richiedi Ripristino"}
              </span>
            </button>
          </form>

          {/* Divisore per Social Logins */}
          <div className="relative my-8 font-mono">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-[9px] uppercase tracking-wider">
              <span className="bg-slate-950 px-3 text-slate-500">Oppure firma con</span>
            </div>
          </div>

          {/* Bottone Google OAuth */}
          <button
            type="button"
            onClick={handleAuthGoogleSignIn}
            className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/40 text-slate-300 font-mono py-3 rounded-xl transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-inner cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Google Cloud Network
          </button>

          {/* Back Link */}
          <div className="text-center mt-8 font-mono text-[9px] uppercase tracking-widest">
            <Link href={`/${lang}`} className="text-slate-500 hover:text-cyan-400 transition-colors">
              &larr; Ritorna alla Hangar Homepage
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // INTERFACCIA 1: WIZARD DI ONBOARDING (se onboarding_completed è false)
  if (!profile.onboarding_completed) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-6 md:p-10 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.05),transparent)] pointer-events-none z-0"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/3 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-xl bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl relative z-10 shadow-2xl">
          <div className="mb-8 font-mono text-center relative">
            <button
              onClick={handleSignOut}
              className="absolute top-0 right-0 text-[9px] uppercase tracking-wider text-slate-500 hover:text-red-400 transition-colors border border-slate-850 px-2.5 py-1 rounded bg-slate-950 cursor-pointer"
            >
              Sign Out
            </button>
            <span className="text-[10px] text-emerald-400 uppercase tracking-[0.3em] font-black block mb-2">Firma Radar Attivata</span>
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Profilazione Pilota</h1>
            <div className="w-full bg-slate-950 h-1.5 rounded-full mt-4 overflow-hidden border border-slate-900 p-0.5 flex">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${(onboardingStep / 3) * 100}%` }}></div>
            </div>
          </div>

          {/* STEP 1: Aeroporto Base */}
          {onboardingStep === 1 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-2 font-mono flex items-center gap-2">
                <span className="text-emerald-400">01.</span> REGISTRA LICENZA E AEROPORTO BASE
              </h2>
              <p className="text-xs text-slate-400 mb-6 font-mono">Imposta il tuo nome radar e seleziona l'hub di base per gli avvistamenti.</p>
              
              {/* Pilot Callsign Input */}
              <div className="mb-6 font-mono">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Identificativo Callsign Pilota
                </label>
                <input
                  type="text"
                  value={pilotCallsign}
                  onChange={(e) => setPilotCallsign(e.target.value.toUpperCase())}
                  placeholder="ES. I-MIRKO, SKYWALKER-77, MAVERICK"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-slate-800"
                />
                <p className="text-[9px] text-slate-500 mt-1.5 leading-snug">
                  Il tuo nome in codice per le comunicazioni ATC e per scalare le classifiche.
                </p>
              </div>

              {/* Airport Input & Autocomplete Search */}
              <div className="mb-8 font-mono">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Aeroporto di Riferimento (Hub Base)
                </label>
                
                {selectedAirport ? (
                  <div className="p-4 rounded-xl border border-emerald-500 bg-emerald-500/10 text-white flex justify-between items-center">
                    <div>
                      <span className="text-[9px] text-emerald-400 uppercase font-black block tracking-widest">Selezionato</span>
                      <span className="text-sm font-bold">{selectedAirport}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAirport("");
                        setAirportQuery("");
                      }}
                      className="text-xs text-red-400 hover:text-red-300 hover:underline cursor-pointer"
                    >
                      Resetta Cerca
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={airportQuery}
                      onChange={(e) => setAirportQuery(e.target.value)}
                      placeholder="Cerca aeroporto per nome o IATA (es. Malpensa, JFK, FCO)..."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-slate-800"
                    />
                    
                    {airportQuery.trim() !== "" && (
                      <div className="absolute w-full mt-2 bg-slate-950 border border-slate-850 rounded-xl overflow-hidden z-30 shadow-2xl text-xs max-h-60 overflow-y-auto">
                        {filteredAirports.map((airport) => (
                          <button
                            key={airport.id}
                            type="button"
                            onClick={() => {
                              setSelectedAirport(`${airport.name} (${airport.iata_code})`);
                              setAirportQuery("");
                            }}
                            className="w-full text-left p-3 border-b border-slate-900 hover:bg-slate-900/60 text-slate-355 flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <span className="font-bold text-white">{airport.name}</span>
                            <span className="text-[10px] text-emerald-455 font-mono border border-slate-800 bg-slate-900 px-2 py-0.5 rounded">{airport.iata_code}</span>
                          </button>
                        ))}
                        {filteredAirports.length === 0 && (
                          <div className="p-3 text-slate-600 text-center">Nessun aeroporto trovato</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  disabled={!selectedAirport || !pilotCallsign.trim()}
                  onClick={() => setOnboardingStep(2)}
                  className="bg-emerald-500 text-slate-950 font-bold px-8 py-3 rounded-xl hover:bg-emerald-400 disabled:opacity-30 disabled:pointer-events-none transition-all uppercase tracking-wider font-mono text-xs cursor-pointer"
                >
                  Continua &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Compagnia Preferita */}
          {onboardingStep === 2 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-2 font-mono flex items-center gap-2">
                <span className="text-emerald-400">02.</span> SCEGLI LA TUA COMPAGNIA PREFERITA
              </h2>
              <p className="text-xs text-slate-400 mb-6 font-mono">Digita e seleziona la compagnia che segui o usi di più.</p>

              <div className="relative mb-6">
                <input
                  type="text"
                  value={selectedAirline ? selectedAirline.name : airlineQuery}
                  onChange={(e) => {
                    setAirlineQuery(e.target.value);
                    if (selectedAirline) setSelectedAirline(null);
                  }}
                  placeholder="Scrivi es. Alitalia, Emirates, Delta..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 font-mono text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-slate-800"
                />
                
                {airlineSuggestions.length > 0 && !selectedAirline && (
                  <div className="absolute w-full mt-2 bg-slate-950 border border-slate-850 rounded-xl overflow-hidden z-30 shadow-2xl font-mono text-xs">
                    {airlineSuggestions.map((airline) => (
                      <button
                        key={airline.id}
                        onClick={() => setSelectedAirline(airline)}
                        className="w-full text-left p-3 border-b border-slate-900 hover:bg-slate-900/60 text-slate-300 flex items-center gap-3 transition-colors"
                      >
                        <div className="w-8 h-8 rounded bg-white flex items-center justify-center p-1 overflow-hidden shrink-0">
                          <AirlineLogo src={airline.logo_url} alt="" airlineName={airline.name} />
                        </div>
                        <div>
                          <span className="font-bold block text-white">{airline.name}</span>
                          <span className="text-[10px] text-slate-500">IATA: {airline.iata_code || "—"}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-10">
                <button
                  onClick={() => setOnboardingStep(1)}
                  className="border border-slate-700 text-slate-400 font-mono text-xs uppercase tracking-widest px-6 py-3 rounded-xl hover:text-white"
                >
                  &larr; Indietro
                </button>
                <button
                  disabled={!selectedAirline}
                  onClick={() => setOnboardingStep(3)}
                  className="bg-emerald-500 text-slate-950 font-bold px-8 py-3 rounded-xl hover:bg-emerald-400 disabled:opacity-30 disabled:pointer-events-none transition-all uppercase tracking-wider font-mono text-xs"
                >
                  Continua &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Decennio Storico Preferito */}
          {onboardingStep === 3 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-2 font-mono flex items-center gap-2">
                <span className="text-emerald-400">03.</span> IL TUO DECENNIO PREFERITO
              </h2>
              <p className="text-xs text-slate-400 mb-6 font-mono">Quale era della storia del volo ti affascina di più?</p>

              <div className="grid grid-cols-2 gap-3 mb-8 max-h-60 overflow-y-auto pr-1">
                {[
                  { id: "1960s", title: "Anni '60", tag: "Era dei Primi Jet (707, DC-8)" },
                  { id: "1970s", title: "Anni '70", tag: "L'era dei Widebody e Concorde" },
                  { id: "1980s", title: "Anni '80", tag: "Consolidamento e Twin-jets" },
                  { id: "1995s", title: "Anni '95", tag: "Modernizzazione (777, A330)" },
                  { id: "2010s", title: "Anni 2010", tag: "Efficienza Ecologica (787, A350)" },
                  { id: "2020s", title: "Anni 2020", tag: "Sostenibilità e Digitalizzazione" }
                ].map((dec) => (
                  <button
                    key={dec.id}
                    onClick={() => setSelectedDecade(dec.title)}
                    className={`p-4 rounded-xl border text-left font-mono transition-all ${
                      selectedDecade === dec.title
                        ? "border-emerald-500 bg-emerald-500/10 text-white shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                        : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <span className="font-bold text-sm block mb-1">{dec.title}</span>
                    <span className="text-[9px] text-slate-500 block leading-tight">{dec.tag}</span>
                  </button>
                ))}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setOnboardingStep(2)}
                  className="border border-slate-700 text-slate-400 font-mono text-xs uppercase tracking-widest px-6 py-3 rounded-xl hover:text-white"
                >
                  &larr; Indietro
                </button>
                <button
                  disabled={!selectedDecade || savingOnboarding}
                  onClick={handleCompleteOnboarding}
                  className="bg-emerald-500 text-slate-950 font-bold px-8 py-3 rounded-xl hover:bg-emerald-400 disabled:opacity-30 disabled:pointer-events-none transition-all uppercase tracking-wider font-mono text-xs flex items-center gap-2"
                >
                  {savingOnboarding ? "Salvataggio..." : "Inizializza Profilo &rarr;"}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    );
  }

  // INTERFACCIA 2: DASHBOARD PILOTA ATTIVA
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 relative overflow-hidden">
      {/* Sfondo Radiale Sci-Fi */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_60%_50%_at_50%_-20%,rgba(6,182,212,0.06),transparent)] pointer-events-none z-0"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header Profilo e Navigazione */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/20 border border-slate-900 p-6 md:p-8 rounded-3xl backdrop-blur-xl shadow-2xl mb-8 gap-6">
          <div>
            <div className="text-cyan-400 font-mono text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
              {isAdmin ? "AirDex Commander Control License" : "AirDex Active Pilot License"}
              {isAdmin && (
                <span className="ml-2 px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black animate-pulse text-[9px]">
                  COMMANDER
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-1">
              Terminale Pilota
            </h1>
            <p className="text-slate-500 font-mono text-xs">{user.email}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {isAdmin && (
              <Link
                href={`/${lang}/admin`}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-2.5 rounded-xl font-bold font-mono text-xs tracking-widest uppercase text-center flex items-center justify-center gap-2 border border-amber-600 shadow-lg hover:shadow-amber-500/20 transition-all"
              >
                🛰️ Console Comando ATC
              </Link>
            )}
            <button 
              type="button"
              onClick={handleSignOut}
              className="border border-slate-800 text-slate-400 px-6 py-2.5 rounded-xl hover:bg-slate-900 hover:text-white transition font-mono text-xs tracking-widest uppercase w-full md:w-auto hover:border-slate-700"
            >
              Disconnetti Terminale
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLONNA SINISTRA (PILOT CARD + ACHIEVEMENTS) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Pilot Identity Badge */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/2 rounded-full blur-xl"></div>
              
              {/* Avatar e Dettagli Header */}
              {(() => {
                const currentAvatar = AVATARS.find(a => a.id === profile.avatar_id) || AVATARS[0];
                return (
                  <div className="flex items-center gap-4 border-b border-slate-900 pb-4 mb-4">
                    <div 
                      onClick={() => setShowAvatarEditor(!showAvatarEditor)}
                      className="w-16 h-16 rounded-2xl bg-cyan-950/30 border border-cyan-800/80 flex items-center justify-center text-3xl cursor-pointer hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all relative group shrink-0"
                      title="Cambia Avatar Pilota"
                    >
                      <span>{currentAvatar?.emoji}</span>
                      <div className="absolute inset-0 bg-slate-950/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-widest text-center leading-tight">Edit</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-[0.2em] block font-black">
                          {currentAvatar?.title}
                        </span>
                        {profile.is_pro ? (
                          <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black tracking-widest text-[8px] shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse uppercase border border-amber-300/30">
                            PRO
                          </span>
                        ) : (
                          <Link href={`/${lang}/pro`} className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-mono text-[8px] tracking-widest uppercase transition-all border border-slate-700/50 hover:border-cyan-500/50">
                            CADET • UPGRADE
                          </Link>
                        )}
                      </div>
                      <h4 className="text-white font-black uppercase text-base truncate max-w-[140px]" title={profile.pilot_callsign || "ATC PILOT"}>
                        {profile.pilot_callsign || "ATC PILOT"}
                      </h4>
                      <span className="text-[8px] text-slate-500 font-mono block uppercase">
                        {profile.is_pro ? "LICENZA PRO ATTIVA" : "LICENZA ATTIVA"}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Selettore Avatar Olografico */}
              {showAvatarEditor && (
                <div className="mb-6 p-4 rounded-2xl bg-slate-950 border border-slate-900 shadow-inner font-mono">
                  <span className="text-[9px] text-cyan-400 tracking-[0.2em] font-black uppercase block mb-3">
                    Seleziona Modulo Avatar
                  </span>
                  <div className="grid grid-cols-4 gap-2.5">
                    {AVATARS.map((av) => (
                      <button
                        key={av.id}
                        onClick={() => handleSelectAvatar(av.id)}
                        title={`${av.name} (${av.title})`}
                        className={`p-2 rounded-xl text-2xl border transition-all hover:bg-slate-900 flex items-center justify-center ${
                          profile.avatar_id === av.id
                            ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                            : "border-slate-900 bg-slate-950"
                        }`}
                      >
                        {av.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4 font-mono text-xs">
                <div className="flex justify-between py-1 border-b border-slate-900/50">
                  <span className="text-slate-500">BASE HUB</span>
                  <span className="text-white font-bold truncate max-w-[170px]">{profile.home_airport || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900/50">
                  <span className="text-slate-500">PREFERITO</span>
                  <span className="text-cyan-400 font-bold truncate max-w-[170px]">{profile.favorite_airline || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900/50">
                  <span className="text-slate-500">ERA FAVORITA</span>
                  <span className="text-purple-400 font-bold">{profile.favorite_decade || "—"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">PILOT SCORES</span>
                  <span className="text-emerald-400 font-black">{quizHighScore} Pts</span>
                </div>
              </div>

              {/* Reset onboarding */}
              <button
                onClick={() => {
                  if (confirm("Sei sicuro di voler riconfigurare la tua licenza?")) {
                    setProfile(prev => prev ? { ...prev, onboarding_completed: false } : null);
                    setOnboardingStep(1);
                  }
                }}
                className="w-full mt-6 bg-slate-950 border border-slate-900 text-slate-500 hover:text-slate-300 py-2.5 rounded-xl font-mono text-[10px] uppercase tracking-widest transition-colors hover:border-slate-800"
              >
                Riconfigura Licenza
              </button>
            </div>

            {/* Medagliere (Achievements) */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 backdrop-blur-md">
              <h3 className="text-slate-400 font-mono text-[10px] uppercase tracking-widest font-black border-b border-slate-900 pb-3 mb-4">
                Medagliere di Bordo
              </h3>

              <div className="flex flex-col gap-4">
                {achievements.map((ach) => (
                  <div 
                    key={ach.id} 
                    className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${
                      ach.unlocked 
                        ? "border-emerald-500/20 bg-emerald-950/10 text-white" 
                        : "border-slate-900/80 bg-slate-950/20 text-slate-600 opacity-60"
                    }`}
                  >
                    <span className="text-2xl">{ach.unlocked ? ach.icon : "🔒"}</span>
                    <div>
                      <h4 className={`text-xs font-bold ${ach.unlocked ? "text-emerald-400" : "text-slate-600"}`}>
                        {ach.title}
                      </h4>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5 leading-snug">{ach.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* COLONNA DESTRA (TECA / STATS / QUIZ) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Statistiche Collezioni */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-4 relative overflow-hidden">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Completamento</span>
                <span className="text-2xl font-black text-white font-mono block">{stats.aircraftPercentage}%</span>
                <span className="text-[8px] text-slate-600 font-mono block mt-1">{stats.uniqueCapturedAircraft}/{stats.totalAircraft} Modelli</span>
              </div>

              <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-4 relative overflow-hidden">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Avvistati 👁️</span>
                <span className="text-2xl font-black text-cyan-400 font-mono block">{stats.spottedCount}</span>
                <span className="text-[8px] text-slate-600 font-mono block mt-1">Registrati come SPOTTED</span>
              </div>

              <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-4 relative overflow-hidden">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Volati ✈️</span>
                <span className="text-2xl font-black text-purple-400 font-mono block">{stats.flownCount}</span>
                <span className="text-[8px] text-slate-600 font-mono block mt-1">Registrati come FLOWN</span>
              </div>

              <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-4 relative overflow-hidden">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Vettori Loggati</span>
                <span className="text-2xl font-black text-amber-500 font-mono block">{stats.airlinesCount}</span>
                <span className="text-[8px] text-slate-600 font-mono block mt-1">Compagnie spottate/volate</span>
              </div>
            </div>

            {/* Sponsorizzato Radar Ads Banner */}
            <MockAdBanner />

            {/* TAB BAR */}
            <div className="flex border-b border-slate-900 gap-2 overflow-x-auto font-mono text-[10px] tracking-widest uppercase">
              <button 
                onClick={() => setActiveTab("teca")}
                className={`pb-4 px-4 border-b-2 font-bold transition-all ${
                  activeTab === "teca" ? "border-cyan-500 text-cyan-400" : "border-transparent text-slate-500 hover:text-white"
                }`}
              >
                🛸 Teca Velivoli ({tecaShowAll ? aircraftModels.length : stats.uniqueCapturedAircraft})
              </button>
              <button 
                onClick={() => setActiveTab("airlines")}
                className={`pb-4 px-4 border-b-2 font-bold transition-all ${
                  activeTab === "airlines" ? "border-cyan-500 text-cyan-400" : "border-transparent text-slate-500 hover:text-white"
                }`}
              >
                🌐 Compagnie Registrate ({stats.airlinesCount})
              </button>
              <button 
                onClick={() => setActiveTab("quiz")}
                className={`pb-4 px-4 border-b-2 font-bold transition-all ${
                  activeTab === "quiz" ? "border-cyan-500 text-cyan-400" : "border-transparent text-slate-500 hover:text-white"
                }`}
              >
                🎯 Spotter Trainer (Quiz)
              </button>
              <button 
                onClick={() => setActiveTab("settings")}
                className={`pb-4 px-4 border-b-2 font-bold transition-all ${
                  activeTab === "settings" ? "border-cyan-500 text-cyan-400" : "border-transparent text-slate-500 hover:text-white"
                }`}
              >
                ⚙️ Impostazioni
              </button>
            </div>

            {/* CONTENUTO TAB 1: TECA VELIVOLI (CON INTERAZIONE LIVE CATTURE) */}
            {activeTab === "teca" && (
              <div>
                {/* Search & Toggle Teca */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
                  <input
                    type="text"
                    value={tecaSearch}
                    onChange={(e) => setTecaSearch(e.target.value)}
                    placeholder="Filtra aereo per nome o costruttore..."
                    className="w-full md:max-w-xs pl-4 pr-4 py-2.5 rounded-xl bg-slate-950 text-white border border-slate-900 focus:border-cyan-500 focus:outline-none font-mono text-xs transition-all placeholder:text-slate-800"
                  />
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900 font-mono text-[9px] shrink-0">
                    <button 
                      onClick={() => setTecaShowAll(true)}
                      className={`px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider ${tecaShowAll ? "bg-slate-900 text-white font-bold" : "text-slate-500 hover:text-slate-300"}`}
                    >
                      Tutti i velivoli
                    </button>
                    <button 
                      onClick={() => setTecaShowAll(false)}
                      className={`px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider ${!tecaShowAll ? "bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20" : "text-slate-500 hover:text-slate-300"}`}
                    >
                      Solo Collezionati
                    </button>
                  </div>
                </div>

                {/* Grid Velivoli */}
                {filteredTeca.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                    {filteredTeca.map((model) => {
                      const isSpotted = captures.some(c => c.target_id === model.id && c.type === "AIRCRAFT" && c.status === "SPOTTED");
                      const isFlown = captures.some(c => c.target_id === model.id && c.type === "AIRCRAFT" && c.status === "FLOWN");
                      
                      return (
                        <div 
                          key={model.id}
                          className={`bg-slate-900/10 border p-4 rounded-2xl flex items-center justify-between transition-colors shadow-sm ${
                            isSpotted || isFlown ? "border-cyan-950 bg-cyan-950/5" : "border-slate-900 bg-slate-950/20"
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">
                              {model.manufacturers?.name || "Aero"}
                            </span>
                            <Link 
                              href={`/${lang}/aircraft/${model.id}`}
                              className="text-white font-black text-xs hover:text-cyan-400 transition-colors block mt-0.5 truncate"
                            >
                              {model.model_name}
                            </Link>
                            <span className="text-slate-600 text-[8px] font-mono block mt-1">{model.type || "Jet"}</span>
                          </div>

                          <div className="flex gap-2 shrink-0">
                            {/* Spotted Button */}
                            <button
                              onClick={() => toggleCapture(model.id, "AIRCRAFT", "SPOTTED")}
                              title="Segna come avvistato"
                              className={`p-2.5 rounded-xl border text-[10px] transition-all font-mono ${
                                isSpotted 
                                  ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]" 
                                  : "bg-slate-950 border-slate-900 text-slate-600 hover:border-slate-800"
                              }`}
                            >
                              👁️ <span className="hidden sm:inline ml-1">Spotted</span>
                            </button>
                            {/* Flown Button */}
                            <button
                              onClick={() => toggleCapture(model.id, "AIRCRAFT", "FLOWN")}
                              title="Segna come volato"
                              className={`p-2.5 rounded-xl border text-[10px] transition-all font-mono ${
                                isFlown 
                                  ? "bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.15)]" 
                                  : "bg-slate-950 border-slate-900 text-slate-600 hover:border-slate-800"
                              }`}
                            >
                              ✈️ <span className="hidden sm:inline ml-1">Flown</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-900 bg-slate-950/20 rounded-2xl p-16 text-center text-slate-600 font-mono text-xs">
                    Nessun aereo corrisponde ai criteri di ricerca.
                  </div>
                )}
              </div>
            )}

            {/* CONTENUTO TAB 2: COMPAGNIE REGISTRATE */}
            {activeTab === "airlines" && (
              <div>
                <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 mb-6 flex justify-between items-center font-mono text-xs text-slate-500 shadow-inner">
                  <span>Vettori registrati nel tuo hangar personale (Avvistati o Volati).</span>
                </div>

                {captures.filter(c => c.type === "AIRLINE").length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {captures.filter(c => c.type === "AIRLINE").map((capture) => {
                      const airline = capturedAirlines.find(a => a.id === capture.target_id);
                      if (!airline) {
                        return (
                          <div key={capture.id} className="bg-slate-900/10 border border-slate-900 p-4 rounded-2xl flex items-center justify-between text-xs font-mono animate-pulse">
                            <span className="text-slate-500">Recupero dati vettore...</span>
                          </div>
                        );
                      }

                      const logoSrc = airline.logo_url 
                        ? airline.logo_url 
                        : (airline.website ? `https://logo.clearbit.com/${airline.website}` : null);

                      return (
                        <div 
                          key={capture.id}
                          className="bg-slate-900/10 border border-slate-900 p-4 rounded-2xl flex items-center justify-between text-xs font-mono hover:border-cyan-500/50 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center p-1 border border-slate-800 shrink-0 overflow-hidden">
                              <AirlineLogo src={logoSrc} alt={airline.name} airlineName={airline.name} />
                            </div>
                            <div>
                              <span className="text-white block font-black text-sm">{airline.name}</span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">IATA: {airline.iata_code || "—"}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 items-center">
                            <span className={`px-2 py-1 rounded text-[9px] font-bold ${
                              capture.status === "SPOTTED" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            }`}>
                              {capture.status}
                            </span>
                            <button
                              onClick={() => toggleCapture(airline.id, "AIRLINE", capture.status)}
                              className="text-red-500 hover:text-red-400 px-2 font-black transition-colors"
                              title="Rimuovi questo vettore"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-900 bg-slate-950/20 rounded-2xl p-16 text-center text-slate-600 font-mono text-xs">
                    Nessun vettore registrato nella tua bacheca. Vai nella pagina <Link href={`/${lang}/airlines`} className="text-cyan-400 hover:underline">Terminal Compagnie</Link> per iniziare a collezionarli!
                  </div>
                )}
              </div>
            )}

            {/* CONTENUTO TAB 3: GIOCO AEROQUIZ */}
            {activeTab === "quiz" && (
              <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/2 rounded-full blur-xl"></div>
                
                {quizState === "idle" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-6 font-mono">
                    <div className="text-center md:text-left">
                      <span className="text-[40px] block mb-4">🎯</span>
                      <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-2">Spotter Trainer Console</h3>
                      <p className="text-xs text-slate-500 max-w-sm mb-8 leading-relaxed">
                        Metti alla prova la tua conoscenza aeronautica! 10 domande generate in tempo reale sulla flotta. Hai 15 secondi per risposta.
                      </p>
                      <div className="flex flex-col items-center md:items-start gap-4">
                        {aircraftModels.length >= 5 ? (
                          <div className="flex flex-col gap-2 w-full md:w-auto">
                            <button 
                              onClick={startQuiz}
                              className="bg-cyan-500 text-slate-950 font-black px-8 py-3 rounded-xl hover:bg-cyan-400 transition-all uppercase tracking-widest text-xs shadow-lg hover:shadow-cyan-500/10 w-full text-center"
                            >
                              Inizializza Addestramento
                            </button>
                            {!profile?.is_pro && (
                              <span className="text-[10px] text-slate-500 text-center md:text-left">
                                Giocate rimanenti oggi: <strong className="text-cyan-400">{Math.max(0, 3 - playsToday)} / 3</strong>
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 font-mono text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                            Sincronizzazione Flotta...
                          </div>
                        )}
                        <span className="text-[10px] text-slate-600">Punteggio Massimo: {quizHighScore} Pts</span>
                      </div>
                    </div>

                    {/* Classifica Hologram Scoreboard */}
                    <div className="border border-slate-900 bg-slate-950/40 rounded-2xl p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 rounded-full blur-xl"></div>
                      <h4 className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black border-b border-slate-900 pb-3 mb-4 flex items-center justify-between">
                        <span>🏆 LEADERBOARD GLOBALE</span>
                        <span className="text-emerald-400 font-bold">ATC TOP 5</span>
                      </h4>

                      {loadingLeaderboard ? (
                        <div className="flex justify-center items-center py-10">
                          <span className="w-5 h-5 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2.5">
                          {leaderboard.length > 0 ? (
                            leaderboard.map((pilot, idx) => (
                              <div 
                                key={idx} 
                                className={`flex justify-between items-center py-2 px-3 rounded-xl font-mono text-xs border ${
                                  profile?.pilot_callsign === pilot.pilot_callsign 
                                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-bold" 
                                    : "bg-slate-900/10 border-slate-900/50 text-slate-400"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-black text-slate-500 bg-slate-950 border border-slate-900 w-5 h-5 rounded flex items-center justify-center">
                                    {idx + 1}
                                  </span>
                                  <span className="font-bold uppercase tracking-wider">{pilot.pilot_callsign || "PILOTA ANONIMO"}</span>
                                </div>
                                <span className="font-black text-emerald-400">{pilot.quiz_high_score || 0} Pts</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-600 block text-center py-6">Nessun punteggio registrato.</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Telemetria Radar Chart */}
                    <div className="col-span-1 md:col-span-2 mt-8 border border-slate-900 bg-slate-950/30 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/2 rounded-full blur-xl"></div>
                      
                      {/* SVG Canvas */}
                      <div className="w-48 h-48 shrink-0 relative flex items-center justify-center">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 200 210">
                          {/* Concentric pentagons */}
                          {[0.25, 0.5, 0.75, 1].map((scale, sIdx) => {
                            const r = 70 * scale;
                            const points = Array.from({ length: 5 }).map((_, idx) => {
                              const angle = (idx * 2 * Math.PI) / 5 - Math.PI / 2;
                              return `${100 + r * Math.cos(angle)},${105 + r * Math.sin(angle)}`;
                            }).join(" ");
                            return (
                              <polygon
                                key={sIdx}
                                points={points}
                                fill="none"
                                stroke="#1e293b"
                                strokeWidth="0.8"
                                strokeDasharray={sIdx === 3 ? "0" : "2,2"}
                              />
                            );
                          })}

                          {/* Axis Lines */}
                          {Array.from({ length: 5 }).map((_, idx) => {
                            const angle = (idx * 2 * Math.PI) / 5 - Math.PI / 2;
                            const x2 = 100 + 70 * Math.cos(angle);
                            const y2 = 105 + 70 * Math.sin(angle);
                            return (
                              <line
                                key={idx}
                                x1="100"
                                y1="105"
                                x2={x2}
                                y2={y2}
                                stroke="#1e293b"
                                strokeWidth="0.8"
                              />
                            );
                          })}

                          {/* Data Polygon */}
                          <polygon
                            points={(() => {
                              const values = [85, 78, 65, 90, 72];
                              const maxVal = 100;
                              const radius = 70;
                              const cx = 100;
                              const cy = 105;
                              return values.map((val, idx) => {
                                const angle = (idx * 2 * Math.PI) / 5 - Math.PI / 2;
                                const r = (val / maxVal) * radius;
                                const x = cx + r * Math.cos(angle);
                                const y = cy + r * Math.sin(angle);
                                return `${x},${y}`;
                              }).join(" ");
                            })()}
                            fill="rgba(6,182,212,0.12)"
                            stroke="#06b6d4"
                            strokeWidth="1.8"
                            className="drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                          />

                          {/* Data points */}
                          {[85, 78, 65, 90, 72].map((val, idx) => {
                            const angle = (idx * 2 * Math.PI) / 5 - Math.PI / 2;
                            const r = (val / 100) * 70;
                            const x = 100 + r * Math.cos(angle);
                            const y = 105 + r * Math.sin(angle);
                            return (
                              <circle
                                key={idx}
                                cx={x}
                                cy={y}
                                r="3.5"
                                fill="#06b6d4"
                                className="animate-pulse"
                              />
                            );
                          })}
                        </svg>
                      </div>

                      {/* Info & Metrics */}
                      <div className="flex-grow w-full font-mono text-xs">
                        <span className="text-[10px] text-cyan-400 font-black tracking-widest block mb-4 uppercase">
                          📊 DIAGNOSTICA TELEMETRIA PILOTA (PRO ACCESS)
                        </span>
                        
                        <div className="grid grid-cols-2 gap-4 text-left">
                          {[
                            { name: "RECOGNITION (Silhouette)", value: 85, color: "text-cyan-400" },
                            { name: "SPECS (Autonomia/Pax)", value: 78, color: "text-cyan-400" },
                            { name: "HISTORY (Era/Primi Voli)", value: 65, color: "text-purple-400" },
                            { name: "RARITY (Spotted Rari)", value: 90, color: "text-amber-500 animate-pulse" },
                            { name: "FLEET (Vettori di Linea)", value: 72, color: "text-cyan-400" }
                          ].map((item, idx) => (
                            <div key={idx} className="border-b border-slate-900/50 pb-2">
                              <span className="text-[8px] text-slate-500 block leading-tight">{item.name}</span>
                              <div className="flex justify-between items-baseline mt-1">
                                <span className={`font-black ${item.color}`}>{item.value}%</span>
                                <div className="w-16 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900 p-0.5 flex">
                                  <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${item.value}%` }}></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {quizState === "playing" && quizQuestions.length > 0 && (
                  <div className="font-mono">
                    {/* Header Quiz */}
                    <div className="flex justify-between items-center border-b border-slate-900 pb-3 mb-6 text-xs text-slate-500">
                      <span>DOMANDA: <strong className="text-white">{currentQuestionIdx + 1}/10</strong></span>
                      <span className="flex items-center gap-2">
                        SCORE: <strong className="text-emerald-400">{quizScore}</strong>
                      </span>
                      <span className={`font-bold px-2 py-0.5 rounded ${
                        quizTimeLeft < 5 ? "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse" : "bg-slate-950 text-cyan-400"
                      }`}>
                        TEMPO: {quizTimeLeft}s
                      </span>
                    </div>

                    {/* Testo Domanda */}
                    <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-6 text-center mb-6 min-h-[90px] flex items-center justify-center">
                      <p className="text-sm md:text-base font-bold text-slate-100 leading-relaxed">
                        {quizQuestions[currentQuestionIdx].questionText}
                      </p>
                    </div>

                    {/* Opzioni di Risposta */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {quizQuestions[currentQuestionIdx].options.map((option: string, idx: number) => {
                        const isSelected = selectedAnswer === option;
                        const isCorrectOption = option === quizQuestions[currentQuestionIdx].correctAnswer;
                        
                        let optionStyle = "border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900/30";
                        if (selectedAnswer !== null) {
                          if (isCorrectOption) {
                            optionStyle = "border-emerald-500 bg-emerald-500/20 text-emerald-400 font-bold shadow-[0_0_15px_rgba(16,185,129,0.15)]";
                          } else if (isSelected) {
                            optionStyle = "border-red-500 bg-red-500/20 text-red-400 font-bold shadow-[0_0_15px_rgba(220,38,38,0.15)]";
                          } else {
                            optionStyle = "border-slate-900 bg-slate-950 text-slate-600 opacity-40";
                          }
                        }

                        return (
                          <button
                            key={idx}
                            disabled={selectedAnswer !== null}
                            onClick={() => handleAnswerSelect(option)}
                            className={`p-4 rounded-xl border text-left text-xs transition-all ${optionStyle}`}
                          >
                            <span className="font-bold mr-2 text-slate-500">{String.fromCharCode(65 + idx)}.</span>
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {quizState === "ended" && (
                  <div className="text-center py-10 font-mono">
                    <span className="text-[40px] block mb-4">🏆</span>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-2">Sessione Completata</h3>
                    <p className="text-xs text-slate-500 mb-6">
                      Addestramento terminato con successo!
                    </p>
                    <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 max-w-xs mx-auto mb-8 flex justify-around">
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1">SCORE OTTENUTO</span>
                        <span className="text-2xl font-black text-emerald-400">{quizScore}</span>
                      </div>
                      <div className="border-r border-slate-900"></div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1">RECORD MASSIMO</span>
                        <span className="text-2xl font-black text-cyan-400">{quizHighScore}</span>
                      </div>
                    </div>
                    <button 
                      onClick={startQuiz}
                      className="bg-cyan-500 text-slate-950 font-black px-8 py-3 rounded-xl hover:bg-cyan-400 transition-all uppercase tracking-widest text-xs"
                    >
                      Avvia Nuova Sessione
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* CONTENUTO TAB 4: IMPOSTAZIONI TERMINALE */}
            {activeTab === "settings" && (
              <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden space-y-8 animate-fade-in">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/2 rounded-full blur-xl pointer-events-none"></div>

                {/* LOG MESSAGES / ALERTS */}
                {settingsMessage && (
                  <div className={`p-4 rounded-xl border font-mono text-xs text-center transition-all ${
                    settingsMessageType === "error" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                    settingsMessageType === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 animate-pulse" :
                    "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                  }`}>
                    {settingsMessage}
                  </div>
                )}

                {/* SEZIONE 1: DATI LICENZA PILOTA */}
                <form onSubmit={handleUpdateProfileSettings} className="space-y-6 font-mono">
                  <div className="border-b border-slate-900 pb-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span className="text-cyan-400">01.</span> DATI LICENZA E TELEMETRIA DI VOLO
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">Aggiorna le tue info di volo radar e le impostazioni di comunicazione.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pilot Callsign */}
                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase tracking-widest font-black mb-2">
                        Identificativo Callsign Pilota
                      </label>
                      <input
                        type="text"
                        value={editCallsign}
                        onChange={(e) => setEditCallsign(e.target.value.toUpperCase())}
                        placeholder="ES. I-MAVERICK"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-slate-850"
                      />
                      <p className="text-[9px] text-slate-600 mt-1.5 leading-snug">Il tuo nome in codice radar.</p>
                    </div>

                    {/* Base Hub Airport */}
                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase tracking-widest font-black mb-2">
                        Aeroporto Hub Base
                      </label>
                      <select
                        value={editAirport}
                        onChange={(e) => setEditAirport(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all cursor-pointer text-slate-300"
                      >
                        <option value="">Nessuno</option>
                        {airports.map((airport) => (
                          <option key={airport.id} value={`${airport.name} (${airport.iata_code})`}>
                            {airport.name} ({airport.iata_code})
                          </option>
                        ))}
                      </select>
                      <p className="text-[9px] text-slate-600 mt-1.5 leading-snug">Il tuo aeroporto principale.</p>
                    </div>

                    {/* Favorite Airline (con autocomplete search) */}
                    <div className="relative">
                      <label className="block text-slate-400 text-[10px] uppercase tracking-widest font-black mb-2">
                        Compagnia Aerea Preferita
                      </label>
                      <input
                        type="text"
                        value={editSelectedAirline ? editSelectedAirline.name : editAirlineQuery}
                        onChange={(e) => {
                          setEditAirlineQuery(e.target.value);
                          if (editSelectedAirline) setEditSelectedAirline(null);
                        }}
                        placeholder="Digita es. Emirates, Alitalia..."
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-slate-850"
                      />
                      
                      {editAirlineSuggestions.length > 0 && !editSelectedAirline && (
                        <div className="absolute w-full mt-2 bg-slate-950 border border-slate-850 rounded-xl overflow-hidden z-30 shadow-2xl text-[11px] max-h-48 overflow-y-auto">
                          {editAirlineSuggestions.map((airline) => (
                            <button
                              key={airline.id}
                              type="button"
                              onClick={() => {
                                setEditSelectedAirline(airline);
                                setEditAirlineSuggestions([]);
                              }}
                              className="w-full text-left p-2.5 border-b border-slate-900 hover:bg-slate-900/60 text-slate-350 flex items-center gap-3 transition-colors"
                            >
                              <div className="w-6 h-6 rounded bg-white flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                                <AirlineLogo src={airline.logo_url} alt="" airlineName={airline.name} />
                              </div>
                              <div>
                                <span className="font-bold block text-white">{airline.name}</span>
                                <span className="text-[9px] text-slate-500">IATA: {airline.iata_code || "—"}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="text-[9px] text-slate-600 mt-1.5 leading-snug">Il tuo vettore preferito.</p>
                    </div>

                    {/* Favorite Decade */}
                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase tracking-widest font-black mb-2">
                        Decennio Storico Preferito
                      </label>
                      <select
                        value={editDecade}
                        onChange={(e) => setEditDecade(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all cursor-pointer text-slate-300"
                      >
                        <option value="">Seleziona decennio...</option>
                        <option value="Anni '60">Anni '60 (Primi Jet)</option>
                        <option value="Anni '70">Anni '70 (Widebody/Concorde)</option>
                        <option value="Anni '80">Anni '80 (Consolidamento)</option>
                        <option value="Anni '95">Anni '95 (Modernizzazione)</option>
                        <option value="Anni 2010">Anni 2010 (Efficienza Ecologica)</option>
                        <option value="Anni 2020">Anni 2020 (Sostenibilità)</option>
                      </select>
                      <p className="text-[9px] text-slate-600 mt-1.5 leading-snug">L'era aeronautica preferita.</p>
                    </div>
                  </div>

                  {/* Consents & Subscriptions */}
                  <div className="space-y-3.5 pt-2">
                    {/* Newsletter Checkbox */}
                    <div className="flex items-start gap-3 text-xs text-slate-400 select-none">
                      <input
                        type="checkbox"
                        id="editNewsletter"
                        checked={editNewsletter}
                        onChange={(e) => setEditNewsletter(e.target.checked)}
                        className="mt-0.5 rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-0 focus:ring-offset-0 focus:outline-none cursor-pointer"
                      />
                      <label htmlFor="editNewsletter" className="leading-snug cursor-pointer">
                        Desidero essere iscritto alla newsletter AvGeek per ricevere segnali radar e news di viaggio.
                      </label>
                    </div>

                    {/* Privacy check (ReadOnly representation) */}
                    <div className="flex items-start gap-3 text-xs text-slate-500 select-none">
                      <input
                        type="checkbox"
                        id="editPrivacyRead"
                        checked={true}
                        disabled={true}
                        className="mt-0.5 rounded border-slate-900 bg-slate-950 text-slate-700 opacity-60"
                      />
                      <label htmlFor="editPrivacyRead" className="leading-snug">
                        Consenso Privacy accettato ed attivo. (Registrato il {profile.privacy_accepted ? "correttamente" : "in precedenza"}).
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={settingsLoading}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-6 py-2.5 rounded-xl transition-all uppercase tracking-widest text-xs shadow-lg hover:shadow-cyan-500/10 disabled:opacity-40"
                  >
                    {settingsLoading ? "Aggiornamento in corso..." : "Salva Modifiche Profilo"}
                  </button>
                </form>

                {/* SEZIONE 2: SICUREZZA CHIAVI DI ACCESSO */}
                <form onSubmit={handleChangePassword} className="space-y-6 font-mono pt-4 border-t border-slate-900">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span className="text-cyan-400">02.</span> SICUREZZA CHIAVI DI ACCESSO
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">Aggiorna la tua chiave di accesso digitale al terminale.</p>
                    {user?.app_metadata?.provider === "google" && (
                      <p className="text-[9px] text-amber-500/80 mt-1 leading-snug">
                        Nota: Se hai effettuato l'accesso con Google, puoi configurare una password qui per abilitare l'accesso tradizionale via email.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase tracking-widest font-black mb-2">Nuova Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-slate-850"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase tracking-widest font-black mb-2">Conferma Nuova Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-slate-855"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={settingsLoading || !newPassword}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-6 py-2.5 rounded-xl transition-all uppercase tracking-widest text-xs shadow-lg hover:shadow-cyan-500/10 disabled:opacity-40"
                  >
                    {settingsLoading ? "Aggiornamento in corso..." : "Aggiorna Chiave Accesso"}
                  </button>
                </form>

                {/* SEZIONE 3: ZONA DI PERICOLO HANGAR */}
                <div className="space-y-6 font-mono pt-6 border-t border-slate-900">
                  <div>
                    <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider flex items-center gap-2">
                      ⚠️ ZONA DI PERICOLO HANGAR (ELIMINAZIONE ACCOUNT)
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">Disattiva la licenza ed elimina definitivamente tutti i dati registrati.</p>
                  </div>

                  <div className="bg-red-950/10 border border-red-900/30 rounded-2xl p-5 text-xs text-slate-400 space-y-4">
                    <p className="leading-relaxed text-red-400/90">
                      <strong>ATTENZIONE:</strong> Questa operazione è irreversibile. Lo smantellamento dell'hangar comporta:
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-500 pl-2">
                      <li>La cancellazione di tutte le catture registrate (<strong className="text-slate-400">Spotted / Flown</strong>)</li>
                      <li>La cancellazione dei punteggi massimi ottenuti nel simulatore di addestramento</li>
                      <li>La rimozione della tua chiave d'accesso e della tua firma radar nel database</li>
                    </ul>

                    {/* Checkbox 1 */}
                    <div className="flex items-start gap-3 select-none pt-2">
                      <input
                        type="checkbox"
                        id="delConfirm1"
                        checked={deleteConfirm1}
                        onChange={(e) => setDeleteConfirm1(e.target.checked)}
                        className="mt-0.5 rounded border-slate-800 bg-slate-950 text-red-500 focus:ring-0 focus:ring-offset-0 focus:outline-none cursor-pointer"
                      />
                      <label htmlFor="delConfirm1" className="cursor-pointer text-slate-400 leading-snug">
                        Confermo di voler eliminare definitivamente il mio hangar e tutte le statistiche ad esso associate.
                      </label>
                    </div>

                    {/* Checkbox 2 */}
                    <div className="flex items-start gap-3 select-none">
                      <input
                        type="checkbox"
                        id="delConfirm2"
                        checked={deleteConfirm2}
                        onChange={(e) => setDeleteConfirm2(e.target.checked)}
                        className="mt-0.5 rounded border-slate-800 bg-slate-950 text-red-500 focus:ring-0 focus:ring-offset-0 focus:outline-none cursor-pointer"
                      />
                      <label htmlFor="delConfirm2" className="cursor-pointer text-slate-400 leading-snug">
                        Riconosco che non sarà possibile recuperare questi dati in futuro.
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={settingsLoading || !deleteConfirm1 || !deleteConfirm2}
                    onClick={() => {
                      if (confirm("Sei ASSOLUTAMENTE sicuro di voler smantellare l'hangar ed eliminare la licenza? Questa azione NON può essere annullata.")) {
                        handleDeleteAccount();
                      }
                    }}
                    className="bg-red-600 hover:bg-red-500 text-white font-black px-6 py-2.5 rounded-xl transition-all uppercase tracking-widest text-xs shadow-lg hover:shadow-red-500/10 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {settingsLoading ? "Smantellamento in corso..." : "Smantella Hangar & Rimuovi Licenza"}
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* MODAL BLOCK QUIZ PER LIMITE RAGGIUNTO */}
      {showProBlockModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/90 border border-amber-500/40 p-8 rounded-3xl max-w-md w-full relative shadow-[0_0_50px_rgba(245,158,11,0.15)] backdrop-blur-xl font-mono text-center">
            
            {/* Bottone Chiudi */}
            <button 
              onClick={() => setShowProBlockModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white text-lg transition-colors"
            >
              ✕
            </button>

            <div className="mb-6">
              <span className="text-5xl block mb-4 animate-bounce">⚡</span>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-500 text-[10px] tracking-widest uppercase mb-4 font-black">
                Firma Radar Limitata
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">Limite Giornaliero Raggiunto</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Hai consumato le tue <strong className="text-amber-400">3 sessioni giornaliere</strong> di addestramento incluse nella licenza base.
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 text-left text-[11px] text-slate-400 mb-6 space-y-2.5">
              <p className="flex items-center gap-2">
                <span className="text-amber-500">★</span> Sblocca giocate illimitate con <strong className="text-white">Spotter PRO</strong>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-amber-500">★</span> Rimuovi ogni limitazione di telemetria e tracciamento
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href={`/${lang}/pro`}
                className="w-full text-center text-xs text-slate-950 uppercase tracking-widest font-black py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              >
                🚀 Aggiorna a Spotter PRO
              </Link>
              <button
                onClick={() => setShowProBlockModal(false)}
                className="w-full border border-slate-800 text-slate-500 py-3 rounded-xl hover:text-slate-350 hover:bg-slate-900/40 transition-all uppercase tracking-widest text-[10px] font-bold"
              >
                Ritorna al Terminale
              </button>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}