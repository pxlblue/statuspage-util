require('dotenv').config()

const { getLatency } = require('./graphql'),
  moment = require('moment'),
  fetch = require('node-fetch').default

async function submitPoint(timestamp, value) {
  const res = await fetch(
    `https://api.statuspage.io/v1/pages/${process.env.SP_PAGEID}/metrics/${process.env.SP_METRICID}/data.json`,
    {
      headers: {
        Authorization: `OAuth ${process.env.SP_APIKEY}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        data: { timestamp, value },
      }),
    }
  )
  const json = await res.json()
  console.log(json)
}

//.then(console.log)
async function check() {
  let latency = await getLatency(process.env.CF_ZONE_ID)
  latency = latency.reverse()
  for (let event of latency) {
    let ts = moment(event.datetime).unix()
    await submitPoint(ts, event.rttMs)
  }
}
setInterval(check, parseInt(process.env.INTERVAL, 10))
check()
