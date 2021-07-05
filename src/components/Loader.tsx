import './Loader.scss';

interface LoaderProps {
  info: string,
}

export const Loader = ({ info }: LoaderProps) => {
  return (
    <section className="loader">
      <div>
        <span>Info:</span>
        <span>{info}</span>
      </div>
    </section>
  )
};
