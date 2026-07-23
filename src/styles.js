import './App.css'

// App.css is a global stylesheet (not CSS Modules).
// Map styles.className -> "className" so existing className={styles.xxx} usage works.
const styles = new Proxy(
  {},
  {
    get: (_target, prop) => (typeof prop === 'string' ? prop : undefined),
  },
)

export default styles
