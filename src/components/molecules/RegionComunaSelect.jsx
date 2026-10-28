// Molécula: selector encadenado Región -> Comuna (la comuna depende de la región elegida).
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import { regionesYComunas } from '../../data/catalogs'
import FormField from './FormField'

export default function RegionComunaSelect({ region, comuna, onChange, errors = {}, idPrefix = '' }) {
  const regiones = regionesYComunas.map((r) => ({ value: r.region, label: r.region }))
  const comunas = (regionesYComunas.find((r) => r.region === region)?.comunas ?? []).map((c) => ({
    value: c,
    label: c,
  }))

  return (
    <Row>
      <Col xs={12} md={6}>
        <FormField
          as="select"
          id={`${idPrefix}region`}
          label="Región"
          required
          options={regiones}
          placeholder="Selecciona una región"
          value={region}
          error={errors.region}
          // Al cambiar de región se limpia la comuna: así nunca queda una comuna de otra región.
          onChange={(e) => onChange({ region: e.target.value, comuna: '' })}
        />
      </Col>
      <Col xs={12} md={6}>
        <FormField
          as="select"
          id={`${idPrefix}comuna`}
          label="Comuna"
          required
          options={comunas}
          placeholder={region ? 'Selecciona una comuna' : 'Primero elige una región'}
          value={comuna}
          disabled={!region}
          error={errors.comuna}
          onChange={(e) => onChange({ region, comuna: e.target.value })}
        />
      </Col>
    </Row>
  )
}
