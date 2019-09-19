require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')

// establishing the I/O port
const PORT = process.env.PORT || 3000
const app = express()

app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json())

app.listen(PORT, () => console.log(`App is up and running listening on port ${PORT}`))

app.get('/', async (req, res) => {
  try {
    res.json({ message: 'Welcome to Express Auth App!' })
  } catch (e) {
    res.status(e.status).json({ message: e.status })
  }
})

app.post('/test', async (req, res) => {
  try {
    console.log(req.body)
    const data = {
      'response_type': 'in_channel',
      'text': `Testing testing 123! ${req.body.text}`
    }

    res.json(data)
  } catch (e) {
    console.log(e)

    // construct an error response to send
    // to Slack in the case of the user
    // sending an invalid city
    const errorResponse = {
      'response_type': 'in_channel',
      'text': ':face_with_raised_eyebrow: Oh oh, there was a problem with your last request. Please make sure you enter a valid city name.'
    }

    axios.post(req.body.response_url, errorResponse)
  }
})

app.post('/weather', async (req, res) => {
  try {
    console.log(req.body)

    // respond with an OK to sender within 3 secs
    // as required by Slack for delayed responses
    // documentation: https://api.slack.com/slash-commands#responding_response_url
    res.json()

    // extract city passed in as a parameter to
    // our slash command (/weather cityName)
    const query = req.body.text

    // making API request via openWeatherApi function
    const response = await openWeatherApi(query)

    // print out OpenWeather API
    // response to the console
    console.log(response)

    // Create a forecast based on info
    // received from OpenWeather
    const forecast =
      `Current temperature in ${query} is ${response.main.temp} degrees with a high of ${response.main.temp_max} degrees and a low of ${response.main.temp_min} degrees`

    // pass weather code from OpenWeather response
    // to getWeatherEmoji() and receive an emoji
    const emoji = getWeatherEmoji(response.weather[0].id)

    // construct an object (according to Slack API docs)
    // that will be used to send a response
    // back to Slack
    // Add attachments section
    // (see Slack API docs: https://api.slack.com/docs/message-attachments) to display our emoji and description
    const data = {
      'response_type': 'in_channel',
      'text': forecast,
      'attachments': [ // <-- new code
        {
          'text': `Forecast: ${emoji} ${response.weather[0].description}`
        }
      ]
    }

    // make a POST request (with axio) using "response_url"
    // to complete our "delayed response" as
    // per the Slack API docs
    axios.post(req.body.response_url, data)

    // res.json(data)
  } catch (e) {
    console.log(e)

    // contruct an error response to send
    // to Slack in the case of the user
    // sending an invalid city
    const errorResponse = {
      'response_type': 'in_channel',
      'text': ':face_with_raised_eyebrow: Oh oh, there was a problem with your last request. Please make sure you enter a valid city name.'
    }

    axios.post(req.body.response_url, errorResponse)
  }
})

async function openWeatherApi (query) {
  try {
    const url = 'https://api.openweathermap.org/data/2.5/weather'
    const apiKey = 'ADD_YOUR_API_KEY'

    // make api request using axios
    const response = await axios.get(url, {
      params: {
        appid: apiKey,
        q: query,
        units: 'imperial'
      }
    })

    return response.data
  } catch (e) {
    console.log(e)

    // "throw" error, which will be "caught"
    // by the function that called openWeatherApi
    throw new Error('City not found')
  }
}

function getWeatherEmoji (weatherCode) {
  if (weatherCode >= 200 && weatherCode <= 299) {
    return ':thunder_cloud_and_rain:'
  } else if (weatherCode >= 300 && weatherCode <= 399) {
    return ':umbrella_with_rain_drops:'
  } else if (weatherCode >= 500 && weatherCode <= 599) {
    return ':rain_cloud:'
  } else if (weatherCode >= 600 && weatherCode <= 699) {
    return ':snow_cloud:'
  } else if (weatherCode >= 700 && weatherCode <= 799) {
    return ':foggy:'
  } else if (weatherCode === 800) {
    return ':night_with_stars:'
  } else if (weatherCode >= 801 && weatherCode <= 899) {
    return ':sun_behind_cloud:'
  } else {
    return ''
  }
}
