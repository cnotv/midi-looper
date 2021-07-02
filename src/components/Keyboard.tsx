import './Keyboard.scss';

interface KeyboardProps {
  play: (note: string, volume: number, duration?: number) => void;
  current: Record<string, number>
}

export const Keyboard = ({ play, current }: KeyboardProps) => {
  const isTouch = window.navigator.maxTouchPoints > 0;

  return (
    <ul className="keyboard" id="keyboard">
      {new Array(107).fill('').map((note, i) =>
        <li
          className={`keyboard__note ${(current[i] > 0) ? ' keyboard__note--active' : ''}`}
          id={`key${i}`}
          key={i}
          onMouseDown={() => !isTouch ? play(`${i}`, 50) : undefined}
          onMouseUp={() => !isTouch ? play(`${i}`, 0) : undefined}
          onMouseLeave={() => !isTouch ? play(`${i}`, 0) : undefined}
          onTouchStart={() => play(`${i}`, 50)}
          onTouchEnd={() => play(`${i}`, 0)}
        >{i}</li>
      )}
    </ul>
  )
}