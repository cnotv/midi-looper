interface KeyboardProps {
  play: (note: string, volume: number, duration?: number) => void;
  current: Record<string, number>
}

export const Keyboard = ({ play, current }: KeyboardProps) => {
  return (
    <ul className="keyboard" id="keyboard">
      {new Array(107).fill('').map((note, i) =>
        <li
          className={`keyboard__note ${(current[i] > 0) ? ' keyboard__note--active' : ''}`}
          id={`key${i}`}
          key={i}
          onMouseDown={() => play(`${i}`, 50)}
          onMouseUp={() => play(`${i}`, 0)}
          onTouchStart={() => play(`${i}`, 50)}
          onTouchEnd={() => play(`${i}`, 0)}
        >{i}</li>
      )}
    </ul>
  )
}