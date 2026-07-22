import React from 'react';
import { Check } from 'lucide-react';
import { STAGES, type Stage } from '../mocks/data';
import './StageIndicator.css';

interface Props {
  currentStage: Stage;
  isFacilitator: boolean;
  onStageChange?: (stage: Stage) => void;
}

export default function StageIndicator({ currentStage, isFacilitator, onStageChange }: Props) {
  const visibleStages = isFacilitator
    ? STAGES
    : STAGES.filter(s => s.id !== 'grouping');

  const stageOrder: Stage[] = visibleStages.map(s => s.id);
  let currentIdx = stageOrder.indexOf(currentStage);

  if (!isFacilitator && currentStage === 'grouping') {
    currentIdx = 0; // Highlight ideas step while facilitator is grouping
  }

  return (
    <div className="stage-indicator">
      {visibleStages.map((stage, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isClickable = isFacilitator && idx !== currentIdx;

        return (
          <React.Fragment key={stage.id}>
            <div
              className={[
                'stage-step',
                isCompleted ? 'stage-step--completed' : '',
                isCurrent ? 'stage-step--current' : '',
                isClickable ? 'stage-step--clickable' : '',
              ].join(' ')}
              onClick={() => isClickable && onStageChange?.(stage.id)}
              id={`stage-step-${stage.id}`}
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
            >
              <div className="stage-dot">
                {isCompleted ? (
                  <Check size={12} strokeWidth={3} />
                ) : (
                  <span className="stage-emoji">{stage.emoji}</span>
                )}
              </div>
              <span className="stage-label">{stage.label}</span>
            </div>

            {idx < visibleStages.length - 1 && (
              <div className={`stage-connector ${idx < currentIdx ? 'stage-connector--filled' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
