// Estado de un formulario: valores, errores por campo y utilidades.
// Al editar un campo, su mensaje de error desaparece (retroalimentación inmediata).
import { useCallback, useState } from 'react'

export function useForm(initialValues) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')

  const setValue = useCallback((campo, valor) => {
    setValues((actuales) => ({ ...actuales, [campo]: valor }))
    setErrors((actuales) => (actuales[campo] ? { ...actuales, [campo]: undefined } : actuales))
  }, [])

  const reset = useCallback(
    (nuevos = initialValues) => {
      setValues(nuevos)
      setErrors({})
      setFormError('')
    },
    [initialValues],
  )

  return { values, errors, formError, setValue, setValues, setErrors, setFormError, reset }
}
