"use client";
import { Pause, Play } from "lucide-react";
import { useEffect } from "react";
import { useQuizStore } from "@/lib/store";
import { formatTime } from "@/lib/utils";
export default function Timer(){const{timeLeft,isTimerActive,toggleTimer,tickTimer,status}=useQuizStore();useEffect(()=>{if(!isTimerActive||status!=="active")return undefined;const id=setInterval(tickTimer,1000);return()=>clearInterval(id)},[isTimerActive,status,tickTimer]);if(status!=="active")return null;return <div className="card"><div className="label">Temps restant</div><div aria-live="polite" style={{font:'800 1.65rem var(--font-display)',color:timeLeft<60?'var(--danger)':'var(--brand)',marginBottom:'.65rem'}}>{formatTime(timeLeft)}</div><button className={`btn ${isTimerActive?'btn-outline':'btn-primary'}`} style={{width:'100%'}} onClick={toggleTimer}>{isTimerActive?<Pause size={16}/>:<Play size={16}/>} {isTimerActive?'Pause':'Démarrer'}</button></div>}
