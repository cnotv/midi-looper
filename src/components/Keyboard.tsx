import { inputToNote } from '../utils/Looper';
import { KEYS_MAP } from '../config/global';
import './Keyboard.scss';
import { useState } from 'react';

interface KeyboardProps {
  play: (note: string, volume: number, duration?: number) => void;
  current: Record<string, number>
}

const KEYS = new Array(107).fill('');

export const Keyboard = ({ play, current }: KeyboardProps) => {
  const [showIndex, setShowIndex] = useState<boolean>(false);
  const [showKeys, setShowKeys] = useState<boolean>(false);
  const [showNotes, setShowNotes] = useState<boolean>(true);
  const isTouch = window.navigator.maxTouchPoints > 0;
  
  const getActiveClass = (i: number): string => {
    return (current[i] > 0) ? ' keyboard__note--active' : '';
  }

  return (
    <div>
      <div className='keyboard-actions'>
        <button
          className={`button button--text ${showIndex ? ' button--active' : ''}`}
          onClick={() => setShowIndex(!showIndex)}
        >Show Index</button>
        <button
          className={`button button--text ${showKeys ? ' button--active' : ''}`}
          onClick={() => setShowKeys(!showKeys)}
        >Show Keys</button>
        <button
          className={`button button--text ${showNotes ? ' button--active' : ''}`}
          onClick={() => setShowNotes(!showNotes)}
        >Show Notes</button>
      </div>

      <ul className="keyboard" id="keyboard">
        {KEYS.map((note, i) =>
          <li
            className={`keyboard__note ${getActiveClass(i)}`}
            id={`key${i}`}
            key={i}
            onMouseDown={() => !isTouch ? play(`${i}`, 50) : undefined}
            onMouseUp={() => !isTouch ? play(`${i}`, 0) : undefined}
            onMouseLeave={() => !isTouch ? play(`${i}`, 0) : undefined}
            onTouchStart={() => play(`${i}`, 50)}
            onTouchEnd={() => play(`${i}`, 0)}
          >
            <div>{showIndex ? i : ''}</div>
            <div>{showKeys ? KEYS_MAP[i - (12 * 3) - 3] || '-' : ''}</div>
            <div>{showNotes ? inputToNote(i) : ''}</div>
          </li>
        )}
      </ul>
    </div>
  )
}