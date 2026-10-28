// Pasarela de pago SIMULADA. Vive en su propio módulo para poder reemplazarla
// (mock) en las pruebas unitarias sin esperar ni "cobrar" nada.
//
// Con el backend real, aquí se llamaría a Webpay/Transbank u otro proveedor.

export const GATEWAY_DELAY_MS = 800

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const paymentGateway = {
  /**
   * @param {{amount:number, method:string}} payment
   * @returns {Promise<{approved:boolean, transactionId?:string, reason?:string}>}
   */
  async charge({ amount, method }) {
    await esperar(GATEWAY_DELAY_MS)

    if (!(amount > 0)) {
      return { approved: false, reason: 'El monto a pagar no es válido.' }
    }
    if (method === 'tarjeta-rechazada') {
      return { approved: false, reason: 'Pago rechazado por el emisor de la tarjeta (simulación).' }
    }
    return { approved: true, transactionId: `TX-${Date.now().toString(36).toUpperCase()}` }
  },
}
