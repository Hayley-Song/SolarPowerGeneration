// src/components/InfoTooltip.jsx
import { useState } from "react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
} from "@floating-ui/react";

export function InfoTooltip({ text }) {
  const [isOpen, setIsOpen] = useState(false);

  // 💡 위치 및 화면 밖 이탈 자동 제어 설정
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(8), // 아이콘과의 간격 (px)
      flip({ fallbackAxisSideDirection: "start" }), // 화면 위/아래 공간 부족 시 자동 반전
      shift({ padding: 12 }), // 화면 좌/우 가장자리에 붙으면 안쪽으로 자동 밀어넣음
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  return (
    <>
      {/* Trigger 아이콘 */}
      <span
        ref={refs.setReference}
        {...getReferenceProps()}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold cursor-pointer hover:bg-slate-600 hover:text-white transition-colors ml-1.5 align-middle"
      >
        ?
      </span>

      {/* FloatingPortal을 사용하여 z-index/overflow 영향을 받지 않도록 body에 렌더링 */}
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50 bg-white text-mainText text-xs rounded py-1.5 px-2.5 shadow-lg border border-slate-200 max-w-xs whitespace-normal break-keep text-center pointer-events-none"
          >
            {text}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
