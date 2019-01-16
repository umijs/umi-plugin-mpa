import styles from './foo.css';

function App() {
  return (
    <div className={styles.normal}>
      <h1>Foo index</h1>
    </div>
  );
}

require('react-dom').render(<App />, document.getElementById('root'));

