export default function StatusCard({ title, value, help }) {
  return (
    <div style={{ background: '#111827', color: 'white', padding: 16, borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>{value}</div>
      {help ? <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>{help}</div> : null}
    </div>
  )
}
