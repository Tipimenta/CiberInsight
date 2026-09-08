import React, { useState } from 'react';
import type { QuestionReferences } from '../types';
import { ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

interface TraceabilityBoxProps {
  references?: QuestionReferences;
}

/**
 * A interface operacional mostra apenas bases diretas úteis para compreender
 * o controle. Bibliografia e estado da arte permanecem na matriz metodológica
 * e não são exibidos como se fossem fonte normativa direta de cada questão.
 */
export const TraceabilityBox: React.FC<TraceabilityBoxProps> = ({ references }) => {
  const [isOpen, setIsOpen] = useState(false);

  const nist = references?.nist ?? [];
  const lgpd = references?.lgpd ?? [];
  const anpd = references?.anpd ?? [];
  const dicom = references?.dicomComplementary ?? [];
  const other = references?.other ?? [];
  const hasDirectBase =
    nist.length > 0 || lgpd.length > 0 || anpd.length > 0 || dicom.length > 0 || other.length > 0;

  if (!references || !hasDirectBase) return null;

  return (
    <div className="border border-slate-200 rounded-md overflow-hidden bg-slate-50/50">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
          <ShieldCheck className="w-4 h-4 text-indigo-500" />
          Base principal do controle
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="p-3 border-t border-slate-200 bg-white text-xs space-y-2">
          {nist.length > 0 && (
            <div>
              <span className="font-semibold text-slate-800">NIST CSF 2.0: </span>
              <span className="text-slate-600">{nist.join(', ')}</span>
            </div>
          )}

          {lgpd.length > 0 && (
            <div>
              <span className="font-semibold text-slate-800">LGPD: </span>
              <span className="text-slate-600">{lgpd.join(' • ')}</span>
            </div>
          )}

          {anpd.length > 0 && (
            <div>
              <span className="font-semibold text-slate-800">ANPD: </span>
              <span className="text-slate-600">{anpd.join(' • ')}</span>
            </div>
          )}

          {dicom.length > 0 && (
            <div>
              <span className="font-semibold text-slate-800">DICOM (complementar): </span>
              <span className="text-slate-600">{dicom.join(' • ')}</span>
            </div>
          )}

          {other.length > 0 && (
            <div>
              <span className="font-semibold text-slate-800">Outras bases diretas: </span>
              <span className="text-slate-600">{other.join(' • ')}</span>
            </div>
          )}

          <p className="pt-1 text-[10px] leading-relaxed text-slate-500 border-t border-slate-100">
            Bibliografia e referências de estado da arte usadas na construção do instrumento permanecem na matriz metodológica e não são apresentadas aqui como base normativa direta da questão.
          </p>
        </div>
      )}
    </div>
  );
};
