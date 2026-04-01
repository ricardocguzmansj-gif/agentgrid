const sample = `POST /api/admin/companies\n{\n  "name": "Clínica San Juan",\n  "slug": "clinica-san-juan",\n  "industry": "clinic",\n  "ownerEmail": "owner@example.com",\n  "brandPrimary": "#00a884",\n  "brandSecondary": "#0b141a"\n}`

export default function AdminCompaniesPage() {
  return (
    <main className="container">
      <h1>Admin general: crear empresas</h1>
      <p className="muted">Este endpoint está preparado para usar la service role key y crear la empresa, su membership y un agente inicial.</p>
      <div className="card">
        <pre>{sample}</pre>
      </div>
    </main>
  )
}
