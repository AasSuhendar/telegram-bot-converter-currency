const Axios = require('axios') // Axios library for promisified fetch
const BASE_URL = 'https://free.currencyconverterapi.com/api/v6/'

module.exports = {
  /**
     * Get the rate exchange
     * @param {*} source
     * @param {*} destination
     */
  getRate (source, destination) {
    let query = `${source}_${destination}`
    try {
      let currency = Axios.get(`${BASE_URL}convert?q=${query}&compact=ultra`)
      return currency
    } catch (error) {
      console.log(error)
    }
  }
}
