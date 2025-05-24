import './styles.css';

export function Loader() {
  return (
    <section className='flex items-center justify-center w-screen'>
      <div className='loader-container'>
        <div className='bar'></div>
        <div className='bar'></div>
        <div className='bar'></div>
        <div className='bar'></div>
      </div>
    </section>
  );
}
