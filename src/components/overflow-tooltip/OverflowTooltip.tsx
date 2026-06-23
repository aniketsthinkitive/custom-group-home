import React, { useState, useRef, useEffect } from 'react';
import { Typography, Tooltip } from '@mui/material';
import { primaryTextCss } from '../common-table/widgets/common-table-widgets';

interface OverflowTooltipProps {
  text: string;
  sx?: object;
}

const OverflowTooltip: React.FC<OverflowTooltipProps> = ({ text, sx }) => {
  const [overflow, setOverflow] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);
  const lastOverflowRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);

  const measure = () => {
    const el = ref.current;
    if (!el) return;
    const next = el.scrollWidth > el.clientWidth;
    if (next !== lastOverflowRef.current) {
      lastOverflowRef.current = next;
      setOverflow(next);
    }
  };

  const debouncedMeasure = () => {
    if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      measure();
    });
  };

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(debouncedMeasure);
    if (ref.current) ro.observe(ref.current);
    return () => {
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      ro.disconnect();
    };
  }, []);

  const span = (
    <span
      ref={ref}
      style={{
        display: 'block',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
      }}
      onMouseEnter={measure}
    >
      <Typography sx={{ ...primaryTextCss, ...sx }}>{text || '-'}</Typography>
    </span>
  );

  if (!overflow) return span;
  return (
    <Tooltip title={text} arrow placement="top">
      {span}
    </Tooltip>
  );
};

export default OverflowTooltip;
