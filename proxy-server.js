const express = require('express')
const cors = require('cors')

const app = express()

require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

app.use(cors())
app.use(express.json())
app.use(express.static('public'))

const PORT = process.env.PORT || 3001

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: `Swiggy's API wrapper is working ✔`,
  })
})

app.get('/api/restaurants', async (req, res) => {
  const url = `https://www.swiggy.com/dapi/restaurants/list/v5?lat=9.928668&lng=78.092783&is-seo-homepage-enabled=true&page_type=DESKTOP_WEB_LISTING`

  fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      return response.json()
    })
    .then((data) => {
      res.json(data)
    })
    .catch((error) => {
      console.error(error)
      res.status(500).send('An error occurred')
    })
})

app.get('/api/restaurant/:id', async (req, res) => {
  const { id } = req.params
  const url = `https://www.swiggy.com/dapi/menu/pl?page-type=REGULAR_MENU&complete-menu=true&lat=20.275845&lng=85.776639&restaurantId=${id}&catalog_qa=undefined&submitAction=ENTER`

  fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      return response.json()
    })
    .then((data) => {
      res.json(data)
    })
    .catch((error) => {
      console.error(error)
      res.status(500).send('An error occurred')
    })
})

app.post('/api/checkout-payment', async (req, res) => {
  const { cartItems } = req.body

  try {
    const lineItems = cartItems.map((item) => {
      return {
        price_data: {
          currency: 'inr',
          product_data: {
            name: item.name,
            images: [`${process.env.CLOUDINARY_URL}${item.imageId}`],
          },
          unit_amount: Math.round(
            item.price || item.defaultPrice + item.quantity
          ),
        },
        adjustable_quantity: {
          enabled: true,
          minimum: 1,
        },
        quantity: item.quantity,
      }
    })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      submit_type: 'pay',
      billing_address_collection: 'auto',
      // shipping_options: [{ shipping_rate: 'shr_1NeFaFSBzzrld9LFwwmTon9O' }],
    })

    res.json({ id: session.id })
  } catch (err) {
    res.status(err.statusCode || 500).json(err.message)
  }
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))