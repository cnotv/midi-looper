interface KeyboardProps {
  play: (note: string | number, volume: number, duration: number | undefined) => void;
  current: Record<string, number>
}

export const Keyboard = ({ play, current }: KeyboardProps) => {
  return (
    <ul className="keyboard" id="keyboard">
      {new Array(107).fill('').map((note, i) =>
        <li
          className={`keyboard__note ${(current[i] > 0) ? ' keyboard__note--pressed' : ''}`}
          id={`key${i}`}
          key={i}
          onMouseDown={() => play(i, 50, undefined)}
          onMouseUp={() => play(i, 0, undefined)}
          onTouchStart={() => play(i, 50, undefined)}
          onTouchEnd={() => play(i, 0, undefined)}
        >{i}</li>
      )}
    </ul>
  )
}