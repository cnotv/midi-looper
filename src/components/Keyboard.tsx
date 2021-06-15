interface KeyboardProps {
  play: (note: string | number, volume: number, duration: number | undefined) => void;
}

export const Keyboard = ({ play }: KeyboardProps) => {
  return (
    <ul className="keyboard" id="keyboard">
      {new Array(107).fill('').map((note, i) =>
        <li
          className="keyboard__note"
          id={`${i}`}
          key={i}
          onMouseDown={() => play(i, 50, undefined)}
          onMouseOut={() => play(i, 0, undefined)}
          onTouchStart={() => play(i, 50, undefined)}
          onTouchEnd={() => play(1, 0, undefined)}
        >{i}</li>
      )}
    </ul>
  )
}