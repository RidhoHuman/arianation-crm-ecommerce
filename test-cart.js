const knex = require('./src/config/knex');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const axios = require('axios');

knex('user').first().then(u => {
  const token = jwt.sign({ id: u.id, role: u.role }, process.env.JWT_SECRET || 'secret123');
  axios.get('http://localhost:3001/api/cart', { headers: { Authorization: `Bearer ${token}` } })
    .then(r => console.log(JSON.stringify(r.data, null, 2)))
    .catch(e => console.error(e.response ? e.response.data : e.message))
    .finally(() => knex.destroy());
});
