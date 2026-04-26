const axios = require('axios');

const getRate = async (fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return 1;

  const apiUrl = process.env.EXCHANGE_API_URL || 'https://open.er-api.com/v6/latest';
  const response = await axios.get(apiUrl + '/' + fromCurrency);
  const data = response.data;

  if (!data || !data.rates || !data.rates[toCurrency]) {
    throw new Error('Could not fetch currency rate');
  }

  return data.rates[toCurrency];
};

const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  const rate = await getRate(fromCurrency, toCurrency);
  return Number((amount * rate).toFixed(2));
};

module.exports = { convertCurrency };
