"use client";

import { useState, useCallback } from 'react';
import axios from '@/lib/api';
import { TranslationResult, TranslationState } from '@/types/translate';
import TranslateInput from '@/components/translate/TranslateInput';
import TranslateOutput from '@/components/translate/TranslateOutput';
import TranslatePanelHeader from '@/components/translate/TranslatePanelHeader';
import WaveBackground from '@/components/translate/WaveBackground';
import TranslationControls from '@/components/translate/TranslationControls';
import CopyButton from '@/components/translate/CopyButton';
import { AlertCircle, X, Volume2 } from 'lucide-react';

// Simple debounce hook
function useDebounce<T extends (...args: any[]) => void>(callback: T, delay: number) {
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    return useCallback((...args: Parameters<T>) => {
        if (timeoutId) clearTimeout(timeoutId);
        const id = setTimeout(() => {
            callback(...args);
        }, delay);
        setTimeoutId(id);
    }, [callback, delay, timeoutId]);
}

export default function TranslatePage() {
    const [state, setState] = useState<TranslationState>({
        sourceLang: 'en',
        targetLang: 'id',
        inputText: '',
        result: null,
        isLoading: false,
        error: null,
    });

    const translateText = async (text: string, source: string, target: string) => {
        if (!text.trim()) {
            setState(prev => ({ ...prev, result: null, isLoading: false, error: null }));
            return;
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const res = await axios.post('/translate', {
                text,
                source_lang: source,
                target_lang: target
            });

            setState(prev => ({
                ...prev,
                result: {
                    translatedText: res.data.translatedText,
                    match: res.data.match
                },
                isLoading: false
            }));
        } catch (error) {
            console.error('Translation failed', error);
            setState(prev => ({
                ...prev,
                error: 'Could not translate text. Please check your connection or try again later.',
                isLoading: false
            }));
        }
    };

    const debouncedTranslate = useDebounce((text: string, source: string, target: string) => {
        translateText(text, source, target);
    }, 800);

    const handleInputChange = (text: string) => {
        setState(prev => ({ ...prev, inputText: text }));
        debouncedTranslate(text, state.sourceLang, state.targetLang);
    };

    const handleSourceChange = (code: string) => {
        setState(prev => ({ ...prev, sourceLang: code }));
        if (state.inputText) translateText(state.inputText, code, state.targetLang);
    };

    const handleTargetChange = (code: string) => {
        setState(prev => ({ ...prev, targetLang: code }));
        if (state.inputText) translateText(state.inputText, state.sourceLang, code);
    };

    const handleSwap = () => {
        setState(prev => {
            const newSource = prev.targetLang;
            const newTarget = prev.sourceLang;

            let newInput = prev.inputText;
            if (prev.result) {
                newInput = prev.result.translatedText;
            }

            setTimeout(() => translateText(newInput, newSource, newTarget), 0);

            return {
                ...prev,
                sourceLang: newSource,
                targetLang: newTarget,
                inputText: newInput,
                result: null
            };
        });
    };

    const [isSpeaking, setIsSpeaking] = useState(false);

    const handleSpeak = (text: string, lang: string) => {
        if (!text) return;

        // Cancel running speech
        window.speechSynthesis.cancel();

        setIsSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className="relative w-full h-[calc(100vh-8rem)] min-h-[600px] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in fade-in duration-500 ring-1 ring-slate-900/5">

            {/* LEFT PANEL: Source Language (Dark) */}
            <div className="relative w-full md:w-1/2 h-full bg-[#101c22] flex flex-col z-10 px-4 md:px-12 py-8 transition-all">

                <TranslatePanelHeader
                    selectedLang={state.sourceLang}
                    onLangChange={handleSourceChange}
                    theme="dark"
                    leftActions={
                        <>
                            {/* Desktop: Listen then Copy */}
                            <div className="hidden md:flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleSpeak(state.inputText, state.sourceLang)}
                                    className={`p-2 rounded-lg text-white hover:bg-white/10 ${isSpeaking ? 'text-[#0da6f2]' : ''}`}
                                    title="Listen"
                                    disabled={!state.inputText}
                                >
                                    <Volume2 size={20} className={isSpeaking ? 'animate-pulse' : ''} />
                                </button>
                                <CopyButton
                                    text={state.inputText}
                                    color="text-white"
                                    className="hover:bg-white/10"
                                />
                            </div>
                            {/* Mobile: Copy only */}
                            <div className="md:hidden">
                                <CopyButton
                                    text={state.inputText}
                                    color="text-white"
                                    className="hover:bg-white/10"
                                    iconSize={18}
                                />
                            </div>
                        </>
                    }
                    rightActions={
                        <>
                            {/* Mobile: Listen only */}
                            <button
                                onClick={() => handleSpeak(state.inputText, state.sourceLang)}
                                className="md:hidden p-2 rounded-lg text-white hover:bg-white/10"
                                title="Listen"
                                disabled={!state.inputText}
                            >
                                <Volume2 size={18} />
                            </button>
                        </>
                    }
                />

                <div className="flex-1 relative z-10">
                    <TranslateInput
                        value={state.inputText}
                        onChange={handleInputChange}
                        onClear={() => setState(prev => ({ ...prev, inputText: '', result: null }))}
                        lang={state.sourceLang}
                    />
                </div>

                {/* Wave Overlay */}
                <WaveBackground isSpeaking={isSpeaking} />
            </div>

            {/* CENTER FLOATING DOCK (Swap Only) */}
            <TranslationControls
                onSwap={handleSwap}
            />

            {/* RIGHT PANEL: Target Language (Light) */}
            <div className="relative w-full md:w-1/2 h-full bg-[#f5f7f8] flex flex-col z-0 px-4 md:px-12 py-8 transition-all">

                <TranslatePanelHeader
                    selectedLang={state.targetLang}
                    onLangChange={handleTargetChange}
                    theme="light"
                    leftActions={
                        <>
                            {/* Mobile: Copy only */}
                            <div className="md:hidden">
                                <CopyButton
                                    text={state.result?.translatedText || ''}
                                    color="text-gray-500"
                                    className="hover:bg-gray-200"
                                    iconSize={18}
                                />
                            </div>
                        </>
                    }
                    rightActions={
                        <>
                            {/* Desktop: Copy then Listen */}
                            <div className="hidden md:flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                                <CopyButton
                                    text={state.result?.translatedText || ''}
                                    color="text-[#101d23]"
                                    className="hover:bg-gray-200"
                                />
                                <button
                                    onClick={() => handleSpeak(state.result?.translatedText || '', state.targetLang)}
                                    className={`p-2 rounded-lg text-[#101d23] hover:bg-gray-200 ${isSpeaking ? 'text-[#0da6f2]' : ''}`}
                                    title="Listen"
                                    disabled={!state.result?.translatedText}
                                >
                                    <Volume2 size={20} className={isSpeaking ? 'animate-pulse' : ''} />
                                </button>
                            </div>
                            {/* Mobile: Listen only */}
                            <button
                                onClick={() => handleSpeak(state.result?.translatedText || '', state.targetLang)}
                                className={`md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-200 ${isSpeaking ? 'text-[#0da6f2]' : ''}`}
                                title="Listen"
                                disabled={!state.result?.translatedText}
                            >
                                <Volume2 size={18} className={isSpeaking ? 'animate-pulse' : ''} />
                            </button>
                        </>
                    }
                />

                <div className="flex-1 relative">
                    <TranslateOutput
                        value={state.result?.translatedText || ''}
                        lang={state.targetLang}
                        isLoading={state.isLoading}
                        error={state.error}
                    />
                </div>
            </div>

            {/* Error Toast (Floating) */}
            {state.error && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg animate-in slide-in-from-top-2">
                    <AlertCircle size={20} />
                    <p className="font-medium text-sm">{state.error}</p>
                    <button
                        onClick={() => setState(prev => ({ ...prev, error: null }))}
                        className="ml-auto text-red-400 hover:text-red-700 font-bold"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}
