import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) { return twMerge(clsx(inputs)); }
export function shuffleArray(array) { const copy=[...array]; for(let i=copy.length-1;i>0;i-=1){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];} return copy; }
export function formatTime(seconds) { if(!Number.isFinite(seconds)||seconds<0)return "00:00"; return `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(Math.floor(seconds%60)).padStart(2,"0")}`; }
export function isArabicText(value="") { return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(value); }
export function scoreQuestion(question, selected=[]) { const point=Number(question.point)||1; const correct=new Set(question.correct||[]); const incorrect=selected.filter(index=>!correct.has(index)).length; const right=selected.filter(index=>correct.has(index)).length; const raw=correct.size?(right/correct.size)-(incorrect/Math.max(1,question.options.length-correct.size)):0; const score=Math.max(0,Math.min(1,raw))*point; return {score,point,correct:score===point,partial:score>0&&score<point,missed:score===0,right,incorrect}; }
